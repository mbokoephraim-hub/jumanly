/**
 * Sign-up of a company's administrator on a computer (Modèle B, étape 3 A1, captures 020 to 029):
 * after the account and the code, the steps fill the organization the sign-up created (role,
 * company, banner, verification, payment, team). Every write is scoped to the organization the
 * person owns: the sign-up never touches another one.
 */
import { z } from "zod";
import type { MembershipRole, PrismaClient } from "@/generated/prisma/client";
import { can, level, resolvePlan } from "@/server/entitlements";
import { emailField, ownedOrganization } from "./accounts";
import { grantableRoles, inviteMembers, seatUsage } from "./organization";
import { requestVerification } from "./verification";
import type { HireContext } from "./hire";

/** The nine steps of the mockup (ORDRE_A), then « prêt ». */
export const adminSignupSteps = [
  "forfait",
  "compte",
  "code",
  "role",
  "entreprise",
  "logo",
  "verification",
  "paiement",
  "equipe",
] as const;
export type AdminSignupStep = (typeof adminSignupSteps)[number] | "pret";

export function readAdminStep(value: unknown): AdminSignupStep {
  return value === "pret" || (adminSignupSteps as readonly unknown[]).includes(value)
    ? (value as AdminSignupStep)
    : "forfait";
}

/**
 * Plans offered on the first step, in the mockup's order: the free recruiter plan, then the
 * company family (RH Free, Company, Company Plus, Company Premium). Read from the plans in base.
 */
export function signupPlanChoices<T extends { family: string; priceCents: number | null }>(
  plans: T[],
): T[] {
  const free = plans.find((plan) => plan.family === "rh" && plan.priceCents === 0);
  return [...(free ? [free] : []), ...plans.filter((plan) => plan.family === "company")];
}

/** The plan suggested « pour recruter en équipe »: the cheapest paid company plan. */
export function teamPlan<T extends { code: string; family: string; priceCents: number | null }>(
  plans: T[],
): T | undefined {
  return plans
    .filter((plan) => plan.family === "company" && (plan.priceCents ?? 0) > 0)
    .sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0))[0];
}

export const bannerThemes = ["sapin", "nuit", "lime", "creme"] as const;
export type BannerTheme = (typeof bannerThemes)[number];

/** Sizes of the mockup's pills, stored as `Organization.size`. */
export const signupSizes = { s: "1-50", m: "51-200", l: "201-1000", xl: "1000+" } as const;
export type SignupSize = keyof typeof signupSizes;

export function sizeKeyOf(size: string | null | undefined): SignupSize | null {
  const entry = Object.entries(signupSizes).find(([, value]) => value === size);
  if (entry) return entry[0] as SignupSize;
  // Sizes written by older screens.
  if (size === "1-10" || size === "11-50") return "s";
  return null;
}

/** Roles an administrator gives at sign-up (`Recruteur`, `Manager`, `Lecteur`). */
export const signupInviteRoles = ["recruiter", "hiring_manager", "viewer"] as const;

/** The organization of the sign-up: the one the person created and owns. */
export async function signupContext(db: PrismaClient, userId: string) {
  const organization = await ownedOrganization(db, userId);
  if (!organization) return null;
  const ctx: HireContext = { userId, organizationId: organization.id, role: "org_owner" };
  return { organization, ctx };
}

/** Everything the steps and the live preview show. */
export async function adminSignupState(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [organization, membership, plan, subscription, seats, documents] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: {
        id: true,
        name: true,
        sector: true,
        size: true,
        city: true,
        website: true,
        description: true,
        logo: true,
        banner: true,
        bannerTheme: true,
        verificationStatus: true,
        verifiedAt: true,
      },
    }),
    db.membership.findUnique({
      where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
      select: { jobTitle: true },
    }),
    resolvePlan(db, subject),
    db.subscription.findFirst({
      where: {
        subjectType: "organization",
        subjectId: ctx.organizationId,
        status: { in: ["active", "trialing", "past_due"] },
      },
      orderBy: { currentPeriodEnd: "desc" },
      select: { currentPeriodEnd: true, plan: { select: { code: true, priceCents: true } } },
    }),
    seatUsage(db, ctx.organizationId, now),
    db.organizationDocument.count({ where: { organizationId: ctx.organizationId } }),
  ]);
  return {
    organization,
    jobTitle: membership?.jobTitle ?? "",
    planCode: plan?.planCode ?? "",
    planName: plan?.planName ?? "",
    paidUntil:
      subscription?.plan.priceCents && subscription.currentPeriodEnd > now
        ? subscription.currentPeriodEnd
        : null,
    seats,
    documents,
  };
}

const roleSchema = z.string().trim().min(2).max(120);

export async function saveSignupRole(db: PrismaClient, ctx: HireContext, raw: unknown) {
  const jobTitle = roleSchema.safeParse(raw);
  if (!jobTitle.success) return false;
  await db.membership.update({
    where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
    data: { jobTitle: jobTitle.data },
  });
  return true;
}

/** « baobabfintech.cd » → « https://baobabfintech.cd »; an empty field stays empty. */
export function normalizeWebsite(value: string): string | null {
  const text = value.trim();
  if (!text) return "";
  const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".") || url.hostname.endsWith(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const signupCompanySchema = z.object({
  sector: z.string().trim().min(1).max(120),
  size: z.enum(Object.keys(signupSizes) as [SignupSize, ...SignupSize[]]),
  city: z.string().trim().min(1).max(120),
  website: z.string().trim().max(200).default(""),
  description: z.string().trim().max(3000).default(""),
});

export async function saveSignupCompany(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: "required" | "website" }> {
  const parsed = signupCompanySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "required" };
  const website = normalizeWebsite(parsed.data.website);
  if (website === null) return { ok: false, error: "website" };
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: {
      sector: parsed.data.sector,
      size: signupSizes[parsed.data.size],
      city: parsed.data.city,
      website: website || null,
      description: parsed.data.description || null,
    },
  });
  return { ok: true };
}

export async function saveBannerTheme(db: PrismaClient, ctx: HireContext, raw: unknown) {
  const theme = z.enum(bannerThemes).safeParse(raw);
  if (!theme.success) return false;
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: { bannerTheme: theme.data },
  });
  return true;
}

const inviteListSchema = z
  .array(z.object({ email: emailField, role: z.enum(signupInviteRoles) }))
  .max(50);

export type SignupInviteResult =
  | {
      ok: true;
      invitations: { email: string; token: string; expiresAt: Date; role: MembershipRole }[];
    }
  | {
      ok: false;
      error: "invalid" | "role" | "seats" | "alreadyMember" | "duplicate";
      email?: string;
    };

/**
 * « Envoyer les invitations »: the whole list must fit in the plan's seats (`org.seats`), then each
 * role is invited like on the Équipe page.
 */
export async function inviteSignupTeam(
  db: PrismaClient,
  ctx: HireContext,
  raw: unknown,
  now = new Date(),
): Promise<SignupInviteResult> {
  const parsed = inviteListSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const list = parsed.data.map((item) => ({ ...item, email: item.email.toLowerCase() }));
  if (new Set(list.map((item) => item.email)).size !== list.length)
    return { ok: false, error: "duplicate" };
  if (list.length === 0) return { ok: true, invitations: [] };
  const permissions = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "org.permissions.level",
  );
  const grantable = grantableRoles(permissions);
  const refused = list.find((item) => !grantable.includes(item.role));
  if (refused) return { ok: false, error: "role", email: refused.email };
  const seats = await seatUsage(db, ctx.organizationId, now);
  if (seats.max >= 0 && seats.used + list.length > seats.max) return { ok: false, error: "seats" };
  const invitations: (SignupInviteResult & { ok: true })["invitations"] = [];
  for (const role of signupInviteRoles) {
    const emails = list.filter((item) => item.role === role).map((item) => item.email);
    if (emails.length === 0) continue;
    const result = await inviteMembers(db, ctx, { emails: emails.join(" "), role }, now);
    if (!result.ok) {
      return {
        ok: false,
        error: result.error === "invalid" ? "invalid" : result.error,
        email: result.email,
      };
    }
    invitations.push(...result.invitations.map((item) => ({ ...item, role })));
  }
  return { ok: true, invitations };
}

/**
 * End of the sign-up: a document joined at step 7 becomes a verification request when the plan
 * includes the verified profile (`org.verified_profile`); otherwise it waits on the company page.
 */
export async function finishAdminSignup(
  db: PrismaClient,
  ctx: HireContext,
  texts: { registration: string; mandate: string },
  email: string,
  now = new Date(),
) {
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { verificationStatus: true, _count: { select: { documents: true } } },
  });
  if (organization.verificationStatus !== "none" || organization._count.documents === 0)
    return false;
  if (!(await can(db, { type: "organization", id: ctx.organizationId }, "org.verified_profile")))
    return false;
  return requestVerification(
    db,
    ctx,
    { registration: texts.registration, mandate: texts.mandate, domainEmail: email },
    now,
  );
}

/** Free mail providers: the domain of such an address says nothing about the company. */
const FREE_MAIL =
  /@(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|aol|proton|protonmail)\./i;

export function companyDomain(email: string): string | null {
  if (FREE_MAIL.test(email)) return null;
  return email.split("@")[1]?.toLowerCase() || null;
}
