"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSafeInternalPath } from "@/lib/signup";
import { sendWelcome } from "@/server/account-emails";
import { auth, enabledProviders } from "@/server/auth";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import {
  emailField,
  passwordField,
  pendingSocialSignup,
  setupAccount,
  signupAccountSchema,
  splitFullName,
  type AuthFieldError,
} from "@/server/services/accounts";
import { allowAttempt, clientIp } from "@/server/rate-limit";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";
import { isPhone } from "@/server/view";
import { reportError } from "@/server/observability";
import { withArrival } from "@/lib/app-intro";

export type AuthFormState = {
  status: "idle" | "invalid" | "error" | "sent" | "done";
  /** Field → text key under `auth.error`. */
  errors?: Record<string, string>;
  /** Form-level error, text key under `auth.error`. */
  error?: string;
  values?: Record<string, string>;
  email?: string;
};

function values(formData: FormData, omit: string[] = ["password", "confirm"]) {
  return Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => typeof value === "string" && !omit.includes(key))
      .map(([key, value]) => [key, String(value)]),
  );
}

function issues(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    result[field] ??= issue.message;
  }
  return result;
}

function code(error: unknown): string {
  if (error instanceof APIError) {
    const body = error.body as { code?: string } | undefined;
    return body?.code ?? error.message;
  }
  return error instanceof Error ? error.message : "";
}

const safeNext = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value : "";
  return text && isSafeInternalPath(text) ? text : undefined;
};

// ─── Sign-up: the profile carried by the provider buttons ───

const entrySchema = z.object({
  profil: z.enum(["talent", "rh", "company"]).catch("talent"),
  email: z.string().trim().max(200).optional().catch(undefined),
  forfait: z.string().max(60).optional().catch(undefined),
});

// ─── Sign-up, step 3: create the account ───────────────────────────

export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const kept = values(formData);
  const raw: Record<string, FormDataEntryValue> = Object.fromEntries(formData);
  // « Prénom et nom » in one field (refonte mobile, lot 2).
  if (typeof raw.name === "string" && !raw.firstName) Object.assign(raw, splitFullName(raw.name));
  const parsed = signupAccountSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", errors: issues(parsed.error), values: kept };
  const input = parsed.data;
  const ip = await clientIp();
  if (ip && !(await allowAttempt("signUp", ip))) {
    return { status: "error", error: "tooManyAttempts", values: kept };
  }
  const now = new Date();
  let userId: string;
  try {
    const result = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        name: `${input.firstName} ${input.lastName ?? ""}`.trim(),
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName || undefined,
        country: input.country?.toUpperCase() || undefined,
        city: input.city || undefined,
        newsletter: input.newsletter === "on",
        aiConsentAt: now,
        termsAcceptedAt: now,
      },
    });
    userId = result.user.id;
  } catch (error) {
    const reason = code(error);
    if (reason.includes("ALREADY_EXISTS")) {
      return { status: "invalid", errors: { email: "emailTaken" }, values: kept };
    }
    if (reason.includes("PASSWORD_COMPROMISED")) {
      return { status: "invalid", errors: { password: "passwordCommon" }, values: kept };
    }
    if (reason.includes("TOO_MANY") || reason.includes("RATE")) {
      return { status: "error", error: "tooManyAttempts", values: kept };
    }
    // Anything else is ours: keep the cause in the logs, the form only says « réessayez ».
    await reportError(error, { message: "Inscription impossible", route: "/inscription/compte" });
    return { status: "error", error: "server", values: kept };
  }
  await setupAccount(db, userId, {
    profile: input.profile,
    orgName: input.orgName,
    orgRole: input.orgRole,
    phone: input.phone === "1",
  });
  await writeSignupFlow({
    profile: input.profile,
    plan: (formData.get("plan") as string) || undefined,
    next: safeNext(formData.get("next")),
    email: input.email,
  });
  redirect("/inscription/verification");
}

// ─── Sign-up, step 4: verify the e-mail with the 6-digit code ──────

const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "codeIncomplete");

export async function verifyEmail(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const flow = await readSignupFlow();
  const email = emailField.safeParse(flow.email ?? formData.get("email"));
  if (!email.success) redirect("/inscription");
  const otp = codeSchema.safeParse(formData.get("code"));
  if (!otp.success) return { status: "invalid", errors: { code: "codeIncomplete" } };
  try {
    await auth.api.verifyEmailOTP({
      headers: await headers(),
      body: { email: email.data, otp: otp.data },
    });
  } catch (error) {
    const reason = code(error);
    const message = reason.includes("EXPIRED")
      ? "codeExpired"
      : reason.includes("TOO_MANY")
        ? "codeTooManyAttempts"
        : "codeInvalid";
    return { status: "invalid", errors: { code: message } };
  }

  const user = await db.user.findUnique({ where: { email: email.data } });
  if (user) {
    const profile = flow.profile ?? "talent";
    const org = await setupAccount(db, user.id, { profile });
    const plan = await resolvePlan(
      db,
      org ? { type: "organization", id: org.id } : { type: "user", id: user.id },
    );
    // A recruiter without a company yet (phone, Modèle B recruteur) is welcomed at the end of
    // the profile, once the company is known.
    const welcome =
      !org && profile === "rh"
        ? Promise.resolve()
        : org && (profile === "rh" || profile === "company")
          ? sendWelcome(user.email, {
              kind: profile === "company" ? "company" : "recruiter",
              firstName: user.firstName ?? user.name,
              plan: plan?.planName ?? "",
              org: org.name,
            })
          : sendWelcome(user.email, {
              kind: "talent",
              firstName: user.firstName ?? user.name,
              plan: plan?.planName ?? "",
            });
    await welcome.catch((error) =>
      reportError(error, { message: "E-mail de bienvenue non envoyé" }),
    );
  }
  // A talent pays a plan chosen on /tarifs after the first questions (« Votre espace est prêt »).
  const org = flow.profile === "rh" || flow.profile === "company";
  const paid =
    org && flow.plan
      ? await db.plan.findUnique({ where: { code: flow.plan }, select: { priceCents: true } })
      : null;
  redirect(paid?.priceCents ? "/inscription/paiement" : withArrival("/app/bienvenue"));
}

export async function resendCode(_: AuthFormState): Promise<AuthFormState> {
  const flow = await readSignupFlow();
  const email = emailField.safeParse(flow.email);
  if (!email.success) redirect("/inscription");
  if (!(await allowAttempt("sendCode", email.data)))
    return { status: "error", error: "resendTooSoon" };
  try {
    await auth.api.sendVerificationOTP({
      headers: await headers(),
      body: { email: email.data, type: "email-verification" },
    });
  } catch {
    return { status: "error", error: "resendTooSoon" };
  }
  return { status: "sent", email: email.data };
}

// ─── Sign-in ───────────────────────────────────────────────────────

const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "required"),
});

export async function signIn(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const kept = values(formData);
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", errors: issues(parsed.error), values: kept };
  const next = safeNext(formData.get("next")) ?? "/app";
  if (!(await allowAttempt("signIn", parsed.data.email))) {
    return { status: "error", error: "tooManyAttempts", values: kept };
  }
  let twoFactor = false;
  try {
    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        rememberMe: formData.get("remember") === "on",
      },
    });
    twoFactor = "twoFactorRedirect" in result && Boolean(result.twoFactorRedirect);
  } catch (error) {
    const reason = code(error);
    if (reason.includes("EMAIL_NOT_VERIFIED")) {
      await writeSignupFlow({ email: parsed.data.email, next });
      redirect("/inscription/verification");
    }
    if (reason.includes("TOO_MANY") || reason.includes("RATE")) {
      return { status: "error", error: "tooManyAttempts", values: kept };
    }
    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { status: true, accounts: { select: { providerId: true } } },
    });
    if (user && user.status !== "active") {
      return { status: "error", error: "accountSuspended", values: kept };
    }
    if (user && !user.accounts.some((account) => account.providerId === "credential")) {
      return { status: "error", error: "googleOnly", values: kept };
    }
    return { status: "error", error: "invalidCredentials", values: kept };
  }
  if (twoFactor) redirect(`/connexion/deux-etapes?${new URLSearchParams({ suite: next })}`);
  redirect(withArrival(next));
}

export async function sendTwoFactorCode(_: AuthFormState): Promise<AuthFormState> {
  try {
    await auth.api.sendTwoFactorOTP({ headers: await headers(), body: {} });
  } catch {
    return { status: "error", error: "sessionExpired" };
  }
  return { status: "sent" };
}

export async function verifyTwoFactor(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const otp = codeSchema.safeParse(formData.get("code"));
  if (!otp.success) return { status: "invalid", errors: { code: "codeIncomplete" } };
  try {
    await auth.api.verifyTwoFactorOTP({
      headers: await headers(),
      body: { code: otp.data, trustDevice: true },
    });
  } catch (error) {
    const reason = code(error);
    if (reason.includes("COOKIE")) return { status: "error", error: "sessionExpired" };
    return {
      status: "invalid",
      errors: { code: reason.includes("TOO_MANY") ? "codeTooManyAttempts" : "codeInvalid" },
    };
  }
  redirect(withArrival(safeNext(formData.get("next")) ?? "/app"));
}

export async function sendMagicLinkAction(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailField.safeParse(formData.get("email"));
  if (!email.success) {
    return { status: "invalid", errors: { email: email.error.issues[0]?.message ?? "required" } };
  }
  if (!(await allowAttempt("magicLink", email.data))) {
    return { status: "sent", email: email.data };
  }
  try {
    await auth.api.signInMagicLink({
      headers: await headers(),
      body: {
        email: email.data,
        callbackURL: withArrival(safeNext(formData.get("next")) ?? "/app"),
      },
    });
  } catch {
    // Same answer whether or not an account exists (textes `login.magic.sent.text`).
  }
  return { status: "sent", email: email.data };
}

/**
 * « Continuer avec Google, Apple ou LinkedIn » (docs/refonte-connexion § 6). The profile chosen on
 * the entry screen waits in the sign-up cookie: a new account resumes the sign-up at the plan
 * step with it, an existing one is simply signed in.
 */
export async function signInWithProvider(provider: string, formData: FormData) {
  const id = enabledProviders().find((item) => item === provider);
  if (!id) redirect("/connexion");
  const next = safeNext(formData.get("next"));
  const profile = entrySchema.shape.profil.parse(formData.get("profil"));
  await writeSignupFlow({ profile, next });
  const plan = typeof formData.get("forfait") === "string" ? String(formData.get("forfait")) : "";
  const signupStep = new URLSearchParams({ profil: profile });
  if (plan) signupStep.set("forfait", plan.slice(0, 60));
  if (next) signupStep.set("suite", next);
  const result = await auth.api.signInSocial({
    headers: await headers(),
    body: {
      provider: id,
      callbackURL: withArrival(next ?? "/app"),
      // A new talent goes on to the first questions; an organization still picks its plan.
      // On a phone, a recruiter goes on to the profile too (Modèle B recruteur, M2).
      newUserCallbackURL:
        profile === "talent" || (profile === "rh" && (await isPhone()))
          ? `/inscription/continuer?${signupStep}`
          : profile === "company"
            ? // The administrator names the company at step 2 (Modèle B, étape 3 A1).
              `/inscription/entreprise?${new URLSearchParams({ etape: "compte", ...(plan ? { forfait: plan.slice(0, 60) } : {}) })}`
            : `/inscription/forfait?${signupStep}`,
      errorCallbackURL: `/connexion?erreur=${id}`,
    },
  });
  if (result.url) redirect(result.url);
  redirect(`/connexion?erreur=${id}`);
}

const socialSignupSchema = z.object({
  profil: z.enum(["talent", "rh", "company"]),
  forfait: z.string().max(60).optional(),
  orgName: z.string().trim().max(120).optional(),
  orgRole: z.string().trim().max(120).optional(),
});

/**
 * Plan step of a sign-up started with a provider: the account exists already, so the step sets it
 * up (organization for recruiters and companies) like the code check does for an e-mail account.
 */
export async function completeSocialSignup(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const parsed = socialSignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/inscription");
  const input = parsed.data;
  if (input.profil !== "talent" && !input.orgName) {
    const query = new URLSearchParams({ profil: input.profil, erreur: "organisation" });
    if (input.forfait) query.set("forfait", input.forfait);
    redirect(`/inscription/forfait?${query}`);
  }
  if (!(await pendingSocialSignup(db, session.user.id))) redirect("/app");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const org = await setupAccount(db, user.id, {
    profile: input.profil,
    orgName: input.orgName,
    orgRole: input.orgRole,
  });
  const plan = input.forfait
    ? await db.plan.findUnique({ where: { code: input.forfait }, select: { priceCents: true } })
    : null;
  await writeSignupFlow({ profile: input.profil, plan: input.forfait });
  const current = await resolvePlan(
    db,
    org ? { type: "organization", id: org.id } : { type: "user", id: user.id },
  );
  await sendWelcome(
    user.email,
    org
      ? {
          kind: input.profil === "company" ? "company" : "recruiter",
          firstName: user.firstName ?? user.name,
          plan: current?.planName ?? "",
          org: org.name,
        }
      : { kind: "talent", firstName: user.firstName ?? user.name, plan: current?.planName ?? "" },
  ).catch((error) => reportError(error, { message: "E-mail de bienvenue non envoyé" }));
  redirect(
    plan?.priceCents && input.profil !== "talent"
      ? "/inscription/paiement"
      : withArrival("/app/bienvenue"),
  );
}

export async function signOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Already signed out.
  }
  redirect("/connexion?deconnecte=1");
}

// ─── Password reset ────────────────────────────────────────────────

/** A link of « Mot de passe oublié » sent before the codes (refonte mobile, lot 2) still works. */
const resetSchema = z.object({ token: z.string().min(1), password: passwordField });

export async function resetPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", errors: issues(parsed.error) };
  try {
    await auth.api.resetPassword({
      headers: await headers(),
      body: { token: parsed.data.token, newPassword: parsed.data.password },
    });
  } catch (error) {
    const reason = code(error);
    if (reason.includes("PASSWORD_COMPROMISED")) {
      return { status: "invalid", errors: { password: "passwordCommon" } };
    }
    return { status: "error", error: "resetLinkInvalid" };
  }
  return { status: "done" };
}

// ─── Password reset with a 6-digit code (refonte mobile, lot 2) ────

/**
 * « Envoyer le code »: the same answer whether or not the address has an account; the address
 * waits in the short sign-up cookie (never in an address bar) for the next screen.
 */
export async function requestPasswordCode(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailField.safeParse(formData.get("email"));
  if (!email.success) {
    return {
      status: "invalid",
      errors: { email: email.error.issues[0]?.message ?? "required" },
      values: values(formData),
    };
  }
  if (await allowAttempt("passwordReset", email.data)) {
    try {
      await auth.api.requestPasswordResetEmailOTP({
        headers: await headers(),
        body: { email: email.data },
      });
    } catch {
      // Never reveal whether the address exists.
    }
  }
  await writeSignupFlow({ resetEmail: email.data });
  redirect("/reinitialiser");
}

export async function resendPasswordCode(_: AuthFormState): Promise<AuthFormState> {
  const email = emailField.safeParse((await readSignupFlow()).resetEmail);
  if (!email.success) redirect("/mot-de-passe-oublie");
  if (!(await allowAttempt("sendCode", email.data))) {
    return { status: "error", error: "resendTooSoon" };
  }
  try {
    await auth.api.requestPasswordResetEmailOTP({
      headers: await headers(),
      body: { email: email.data },
    });
  } catch {
    // Same answer as above.
  }
  return { status: "sent", email: email.data };
}

const resetCodeSchema = z.object({ code: codeSchema, password: passwordField });

/**
 * « Enregistrer »: checks the code, saves the new password and closes every other session
 * (`revokeSessionsOnPasswordReset`), then signs the person in on this device.
 */
export async function resetPasswordWithCode(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailField.safeParse((await readSignupFlow()).resetEmail);
  if (!email.success) redirect("/mot-de-passe-oublie");
  const parsed = resetCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", errors: issues(parsed.error) };
  try {
    await auth.api.resetPasswordEmailOTP({
      headers: await headers(),
      body: { email: email.data, otp: parsed.data.code, password: parsed.data.password },
    });
  } catch (error) {
    const reason = code(error);
    if (reason.includes("PASSWORD_COMPROMISED")) {
      return { status: "invalid", errors: { password: "passwordCommon" } };
    }
    const message = reason.includes("EXPIRED")
      ? "codeExpired"
      : reason.includes("TOO_MANY")
        ? "codeTooManyAttempts"
        : "codeInvalid";
    return { status: "invalid", errors: { code: message } };
  }
  // The address stays in the short cookie: the page around « Mot de passe modifié » needs it.
  let signedIn = false;
  try {
    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: { email: email.data, password: parsed.data.password, rememberMe: true },
    });
    signedIn = !("twoFactorRedirect" in result && result.twoFactorRedirect);
  } catch {
    // The password is saved: signing in from /connexion still works.
  }
  return { status: "done", values: { signedIn: signedIn ? "1" : "0" } };
}

/** Used by pages to send a signed-in visitor straight to their space. */
export async function isSignedIn() {
  return Boolean(await getSession());
}

export type { AuthFieldError };
