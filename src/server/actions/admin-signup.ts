"use server";

import { APIError } from "better-auth/api";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { withArrival } from "@/lib/app-intro";
import { SIGNUP_SECTORS } from "@/lib/entreprise";
import { absoluteUrl, sendWelcome } from "@/server/account-emails";
import { auth } from "@/server/auth";
import { getSession, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { invalidate, resolvePlan } from "@/server/entitlements";
import { setActiveSpace } from "@/server/hire-context";
import { mailOrgInvite } from "@/server/hire-emails";
import { reportError } from "@/server/observability";
import { paymentProvider } from "@/server/payments";
import { allowAttempt, clientIp } from "@/server/rate-limit";
import {
  emailField,
  passwordField,
  pendingSocialSignup,
  setupAccount,
  splitFullName,
} from "@/server/services/accounts";
import { addVerificationDocuments, OrgAdminError } from "@/server/services/admin-orgs";
import {
  finishAdminSignup,
  inviteSignupTeam,
  saveBannerTheme,
  saveSignupCompany,
  saveSignupRole,
  signupContext,
} from "@/server/services/admin-signup";
import { notify } from "@/server/services/notifications";
import { BrandImageError, saveBrandImage } from "@/server/services/organization-brand";
import { refreshPayment, startCheckout } from "@/server/services/subscriptions";
import { confirmationCallback } from "@/server/services/signup-confirmation";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";
import { fileStorage } from "@/server/storage";

/**
 * Sign-up of a company's administrator on a computer (Modèle B, étape 3 A1). Each step saves,
 * then the page moves to the next one (`?etape=`); the order of the writes follows CLAUDE.md:
 * validate → session → organization of the person → service.
 */
const PAGE = "/inscription/entreprise";
const step = (name: string, extra: Record<string, string> = {}) =>
  `${PAGE}?${new URLSearchParams({ etape: name, ...extra })}`;

export type AdminSignupState = {
  status: "idle" | "invalid" | "error";
  /** Field → key under `auth.error` or `adminSignup`. */
  errors?: Record<string, string>;
  /** Key under `adminSignup` or `auth.error.` (prefixed). */
  error?: string;
  values?: Record<string, string>;
};

function apiCode(error: unknown): string {
  if (error instanceof APIError) {
    const body = error.body as { code?: string } | undefined;
    return body?.code ?? error.message;
  }
  return error instanceof Error ? error.message : "";
}

/** The organization the signed-in person is creating; anyone else goes back to the first step. */
async function requireSignup() {
  const user = await requireUser(PAGE);
  const signup = await signupContext(db, user.id);
  if (!signup) redirect(step("forfait"));
  return { user, ...signup };
}

/** The plan chosen at step 1, kept only if it is one of the sign-up's plans. */
async function chosenPlan(value: FormDataEntryValue | null) {
  const code = typeof value === "string" ? value.slice(0, 60) : "";
  const plan = code
    ? await db.plan.findFirst({
        where: {
          code,
          active: true,
          OR: [
            { family: "company", priceCents: { gt: 0 } },
            { family: "rh", priceCents: 0 },
          ],
        },
        select: { code: true },
      })
    : null;
  return plan?.code;
}

// ─── Step 2 · the account and the company's name ──────────────────────

const name = z
  .string()
  .trim()
  .min(1, "required")
  .max(80, "nameInvalid")
  .regex(/^[\p{L}\p{M}' .-]+$/u, "nameInvalid");

const accountSchema = z.object({
  name,
  orgName: z.string().trim().min(2, "orgNameRequired").max(120, "orgNameRequired"),
  email: emailField,
  password: passwordField,
  terms: z.literal("on", { error: "termsRequired" }),
});

export async function adminSignUpAction(
  _: AdminSignupState,
  formData: FormData,
): Promise<AdminSignupState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    orgName: String(formData.get("orgName") ?? ""),
    email: String(formData.get("email") ?? ""),
    terms: formData.get("terms") === "on" ? "on" : "",
  };
  const parsed = accountSchema.safeParse({ ...values, password: formData.get("password") ?? "" });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { status: "invalid", errors, values };
  }
  const input = parsed.data;
  const plan = await chosenPlan(formData.get("plan"));
  const ip = await clientIp();
  if (ip && !(await allowAttempt("signUp", ip))) {
    return { status: "error", error: "auth.error.tooManyAttempts", values };
  }
  const { firstName, lastName } = splitFullName(input.name);
  const now = new Date();
  let userId: string;
  try {
    const result = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        name: input.name.trim(),
        email: input.email,
        password: input.password,
        firstName,
        lastName: lastName || undefined,
        newsletter: false,
        aiConsentAt: now,
        termsAcceptedAt: now,
        callbackURL: confirmationCallback({ plan }),
      },
    });
    userId = result.user.id;
  } catch (error) {
    const reason = apiCode(error);
    if (reason.includes("ALREADY_EXISTS"))
      return { status: "invalid", errors: { email: "emailTaken" }, values };
    if (reason.includes("PASSWORD_COMPROMISED"))
      return { status: "invalid", errors: { password: "passwordCommon" }, values };
    if (reason.includes("TOO_MANY") || reason.includes("RATE"))
      return { status: "error", error: "auth.error.tooManyAttempts", values };
    await reportError(error, { message: "Inscription impossible", route: PAGE });
    return { status: "error", error: "auth.error.server", values };
  }
  await setupAccount(db, userId, { profile: "company", orgName: input.orgName });
  await writeSignupFlow({ profile: "company", plan, email: input.email, next: undefined });
  redirect(step("code"));
}

/** Step 2 after Google, Apple or LinkedIn: the account exists, the company is named here. */
export async function adminSocialCompanyAction(
  _: AdminSignupState,
  formData: FormData,
): Promise<AdminSignupState> {
  const values = {
    orgName: String(formData.get("orgName") ?? ""),
    terms: formData.get("terms") === "on" ? "on" : "",
  };
  const parsed = z
    .object({
      orgName: z.string().trim().min(2, "orgNameRequired").max(120, "orgNameRequired"),
      terms: z.literal("on", { error: "termsRequired" }),
    })
    .safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { status: "invalid", errors, values };
  }
  const session = await getSession();
  if (!session) redirect(step("compte"));
  if (!(await pendingSocialSignup(db, session.user.id))) redirect(step("role"));
  const plan = await chosenPlan(formData.get("plan"));
  const org = await setupAccount(db, session.user.id, {
    profile: "company",
    orgName: parsed.data.orgName,
  });
  await db.user.update({
    where: { id: session.user.id },
    data: { termsAcceptedAt: new Date() },
  });
  await writeSignupFlow({ profile: "company", plan });
  await welcome(session.user.id, org?.name ?? parsed.data.orgName);
  redirect(step("role"));
}

async function welcome(userId: string, orgName: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const org = await signupContext(db, userId);
  const plan = org
    ? await resolvePlan(db, { type: "organization", id: org.ctx.organizationId })
    : null;
  await sendWelcome(user.email, {
    kind: "company",
    firstName: user.firstName ?? user.name,
    plan: plan?.planName ?? "",
    org: orgName,
  }).catch((error) => reportError(error, { message: "E-mail de bienvenue non envoyé" }));
}

// ─── Step 3 · the link sent by e-mail ────────────────────────────────
// It opens /inscription/confirmee signed in, which brings the administrator back to the role.

// ─── Steps 4 to 7 · role, company, logo and banner, verification ─────

export async function adminRoleAction(
  _: AdminSignupState,
  formData: FormData,
): Promise<AdminSignupState> {
  const jobTitle = String(formData.get("jobTitle") ?? "");
  const { ctx } = await requireSignup();
  if (!(await saveSignupRole(db, ctx, jobTitle)))
    return { status: "invalid", errors: { jobTitle: "role.error" }, values: { jobTitle } };
  redirect(step("entreprise"));
}

export async function adminCompanyAction(
  _: AdminSignupState,
  formData: FormData,
): Promise<AdminSignupState> {
  const raw = Object.fromEntries(
    ["sector", "size", "city", "website", "description"].map((key) => [
      key,
      String(formData.get(key) ?? ""),
    ]),
  );
  const t = await getTranslations("adminSignup.company.sectors");
  const sector = SIGNUP_SECTORS.find((key) => key === raw.sector);
  const { ctx } = await requireSignup();
  const result = await saveSignupCompany(db, ctx, {
    ...raw,
    sector: sector ? t(sector) : "",
  });
  if (!result.ok)
    return {
      status: "invalid",
      error: result.error === "website" ? "company.error.website" : "company.error.required",
      values: raw,
    };
  updateTag("jobs");
  redirect(step("logo"));
}

export type AdminLogoResult = { ok: true } | { ok: false; code: "image" | "fileType" | "fileSize" };

/** « Importer le logo »: the square logo, framed like on the company page. */
export async function adminLogoAction(formData: FormData): Promise<AdminLogoResult> {
  const file = formData
    .getAll("image")
    .find((entry): entry is File => entry instanceof File && entry.size > 0);
  const { ctx } = await requireSignup();
  if (!file) return { ok: false, code: "image" };
  try {
    await saveBrandImage(
      db,
      fileStorage(db),
      ctx.organizationId,
      "logo",
      new Uint8Array(await file.arrayBuffer()),
    );
  } catch (error) {
    if (error instanceof BrandImageError) return { ok: false, code: error.code };
    throw error;
  }
  updateTag("jobs");
  return { ok: true };
}

export async function adminBannerAction(formData: FormData) {
  const { ctx } = await requireSignup();
  await saveBannerTheme(db, ctx, formData.get("theme"));
  updateTag("jobs");
  redirect(step("verification"));
}

export type AdminDocumentResult = { ok: true } | { ok: false; code: string };

/** « Importer » the trade register: kept on the organization, checked by Jumanly. */
export async function adminDocumentAction(formData: FormData): Promise<AdminDocumentResult> {
  const file = formData
    .getAll("document")
    .find((entry): entry is File => entry instanceof File && entry.size > 0);
  const { ctx } = await requireSignup();
  if (!file) return { ok: false, code: "fileType" };
  try {
    await addVerificationDocuments(db, fileStorage(db), ctx, [
      { name: file.name.slice(0, 200), bytes: new Uint8Array(await file.arrayBuffer()) },
    ]);
  } catch (error) {
    if (error instanceof OrgAdminError) return { ok: false, code: error.code };
    throw error;
  }
  return { ok: true };
}

export async function adminVerificationAction() {
  await requireSignup();
  redirect(step("paiement"));
}

// ─── Step 8 · payment ────────────────────────────────────────────────

export type AdminPaymentResult =
  | { ok: true; paymentId: string; status: string }
  | { ok: false; error: "number" | "duplicate" | "unavailable" };

const operators = ["mpesa", "orange", "airtel"] as const;

const paymentSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("mobile_money"),
    operator: z.enum(operators),
    number: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s.-]/g, ""))
      .pipe(z.string().regex(/^\+\d{8,15}$/)),
  }),
  z.object({ method: z.literal("card") }),
]);

export async function adminStartPaymentAction(raw: unknown): Promise<AdminPaymentResult> {
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "number" };
  const { user, ctx } = await requireSignup();
  const flow = await readSignupFlow();
  const plan = await db.plan.findFirst({
    where: { code: flow.plan ?? "", family: "company", priceCents: { gt: 0 }, active: true },
  });
  const provider = paymentProvider();
  if (!plan || !provider) return { ok: false, error: "unavailable" };
  const input = parsed.data;
  const result = await startCheckout(db, provider, {
    subject: { type: "organization", id: ctx.organizationId },
    planCode: plan.code,
    method: input.method,
    payerId: user.id,
    email: user.email,
    country: user.country ?? "",
    msisdn: input.method === "mobile_money" ? input.number : undefined,
    operator: input.method === "mobile_money" ? input.operator : undefined,
    returnUrl: absoluteUrl(step("paiement")),
  });
  if (result.status === "duplicate") return { ok: false, error: "duplicate" };
  if (result.status === "unavailable") return { ok: false, error: "unavailable" };
  // The provider may answer at once (cards, fake provider).
  const payment = await refreshPayment(db, provider, result.paymentId);
  invalidate({ type: "organization", id: ctx.organizationId });
  return { ok: true, paymentId: result.paymentId, status: payment?.status ?? "pending" };
}

/** Polled by the waiting state; only a payment of the organization being created is read. */
export async function adminPaymentStatusAction(paymentId: string) {
  const { ctx } = await requireSignup();
  const payment = await db.payment.findFirst({
    where: {
      id: String(paymentId).slice(0, 60),
      subjectType: "organization",
      subjectId: ctx.organizationId,
    },
  });
  if (!payment) return null;
  const provider = paymentProvider();
  if (payment.status !== "pending" || !provider) return payment.status;
  const updated = await refreshPayment(db, provider, payment.id);
  return updated?.status ?? null;
}

/** After a payment received: the next step. */
export async function adminPaidAction() {
  const { ctx } = await requireSignup();
  const paid = await db.subscription.findFirst({
    where: {
      subjectType: "organization",
      subjectId: ctx.organizationId,
      status: "active",
      currentPeriodEnd: { gt: new Date() },
      plan: { priceCents: { gt: 0 } },
    },
    select: { id: true },
  });
  if (!paid) redirect(step("paiement", { erreur: "unpaid" }));
  redirect(step("equipe"));
}

/** « Commencer en RH Free et payer plus tard »: nothing is paid, the plan stays the free one. */
export async function adminStartFreeAction() {
  await requireSignup();
  await writeSignupFlow({ plan: undefined });
  redirect(step("equipe"));
}

// ─── Step 9 · the team, then « prêt » ─────────────────────────────────

export async function adminInviteAction(
  _: AdminSignupState,
  formData: FormData,
): Promise<AdminSignupState> {
  let list: unknown = [];
  try {
    list = JSON.parse(String(formData.get("invites") ?? "[]"));
  } catch {
    list = null;
  }
  const { user, organization, ctx } = await requireSignup();
  const result = await inviteSignupTeam(db, ctx, list);
  if (!result.ok)
    return {
      status: "invalid",
      error: `team.error.${result.error === "seats" ? "full" : result.error}`,
      values: { email: result.email ?? "" },
    };
  if (result.invitations.length > 0) {
    const t = await getTranslations("org.roles");
    const invited = await db.user.findMany({
      where: { email: { in: result.invitations.map((item) => item.email) } },
      select: { id: true, email: true },
    });
    for (const invitation of result.invitations) {
      const roleName = t(`${invitation.role as "recruiter"}.text`);
      await mailOrgInvite(invitation.email, {
        inviterName: user.name,
        org: organization.name,
        role: roleName,
        message: "",
        date: invitation.expiresAt,
        token: invitation.token,
      });
      const existing = invited.find((person) => person.email === invitation.email);
      if (existing)
        await notify(db, {
          userIds: [existing.id],
          type: "orgInvite",
          payload: { inviterName: user.name, org: organization.name, role: roleName },
          href: `/app/invitation/${invitation.token}`,
        });
    }
  }
  const t = await getTranslations("adminSignup.verif");
  const format = await getFormatter();
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: ctx.organizationId } },
    select: { jobTitle: true, createdAt: true },
  });
  await finishAdminSignup(
    db,
    ctx,
    {
      registration: t("registration"),
      mandate: t("mandate", {
        date: format.dateTime(membership?.createdAt ?? new Date(), { dateStyle: "long" }),
        role: membership?.jobTitle ?? "",
      }),
    },
    user.email,
  );
  redirect(step("pret"));
}

/** « Entrer dans l'espace administrateur »: the company becomes the active space. */
export async function adminEnterAction() {
  const { ctx } = await requireSignup();
  await setActiveSpace(ctx.organizationId);
  await writeSignupFlow({ plan: undefined });
  redirect(withArrival("/app"));
}
