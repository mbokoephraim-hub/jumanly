/**
 * Jumanly Admin v2 · utilisateurs (docs/admin-v2/PLAN-ADMIN.md, étape 3): checking an account,
 * plans given by hand, extra quota, export of a person's data and account deletion (partie 10).
 * Every write is recorded in `AuditLog` with its reason. Testable without Next.js.
 */
import { z } from "zod";
import { eraseAccountByAdmin } from "@/server/services/account-deletion";
import { Prisma } from "@/generated/prisma/client";
import type { EntitlementType, PrismaClient } from "@/generated/prisma/client";
import {
  GRACE_DAYS,
  invalidate,
  parseLimit,
  resolvePlan,
  usage,
  type Subject,
} from "@/server/entitlements";

const DAY = 86_400_000;
/** A plan or extra quota given by hand lasts two years at most. */
export const GRANT_MAX_DAYS = 730;
export const CREDITS_MAX = 10_000;

export type AuditContext = { actorId: string | null; ip?: string | null };

async function audit(
  db: PrismaClient | Prisma.TransactionClient,
  context: AuditContext,
  action: string,
  targetId: string,
  metadata: Prisma.InputJsonValue,
) {
  await db.auditLog.create({
    data: {
      actorId: context.actorId,
      action,
      targetType: "user",
      targetId,
      metadata,
      ip: context.ip ?? null,
    },
  });
}

export class AdminUserError extends Error {
  constructor(
    readonly code:
      | "notFound"
      | "self"
      | "lastAdmin"
      | "owner"
      | "deleted"
      | "plan"
      | "until"
      | "quota"
      | "unlimited"
      | "grant"
      | "confirm",
  ) {
    super(code);
    this.name = "AdminUserError";
  }
}

// ─── Vérifier un utilisateur ──────────────────────────────────────

/** How the person signs in: `credential` (password), `google`, `linkedin`, `apple`… */
export async function accountCheck(db: PrismaClient, userId: string) {
  const [user, accounts, lastSession, certificates] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, twoFactorEnabled: true },
    }),
    db.account.findMany({ where: { userId }, select: { providerId: true } }),
    db.session.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.certificate.findMany({
      where: { enrollment: { userId } },
      orderBy: { issuedAt: "desc" },
      take: 10,
      select: {
        id: true,
        code: true,
        issuedAt: true,
        revokedAt: true,
        enrollment: { select: { course: { select: { title: true } } } },
      },
    }),
  ]);
  if (!user) return null;
  return {
    emailVerified: user.emailVerified,
    twoFactor: user.twoFactorEnabled,
    methods: [...new Set(accounts.map((account) => account.providerId))].sort(),
    lastSignIn: lastSession?.createdAt ?? null,
    certificates: certificates.map((certificate) => ({
      id: certificate.id,
      code: certificate.code,
      course: certificate.enrollment.course.title,
      issuedAt: certificate.issuedAt,
      revoked: certificate.revokedAt !== null,
    })),
  };
}

/** « Marquer l'e-mail comme vérifié » by hand (the person never received the code). */
export async function markEmailVerified(
  db: PrismaClient,
  context: AuditContext,
  userId: string,
  reason: string,
) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) throw new AdminUserError("notFound");
  if (user.status === "deleted") throw new AdminUserError("deleted");
  await db.user.update({ where: { id: userId }, data: { emailVerified: true } });
  await audit(db, context, "user.email.verify", userId, { reason });
}

// ─── Droits et quotas ─────────────────────────────────────────────

/** Where a right comes from: the plan paid, a partner licence, a plan given by hand, the free plan, or an extra. */
export type RightSource = "plan" | "license" | "gift" | "free" | "override";

export type RightRow = {
  key: string;
  type: EntitlementType;
  value: string;
  source: RightSource;
  override: { id: string; reason: string; expiresAt: Date | null } | null;
  /** Quotas of the period (keys ending in `.monthly`). */
  used: number | null;
};

export async function userRights(db: PrismaClient, userId: string, now = new Date()) {
  return subjectRights(db, { type: "user", id: userId }, now);
}

/** Rights of a person or an organization, with the origin of each one. */
export async function subjectRights(db: PrismaClient, subject: Subject, now = new Date()) {
  invalidate(subject);
  const plan = await resolvePlan(db, subject, now);
  if (!plan) return null;
  const [entitlements, overrides, subscription] = await Promise.all([
    db.planEntitlement.findMany({
      where: { planId: plan.planId },
      orderBy: { key: "asc" },
      select: { key: true, type: true },
    }),
    db.entitlementOverride.findMany({
      where: {
        subjectType: subject.type,
        subjectId: subject.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "asc" },
    }),
    plan.subscriptionId
      ? db.subscription.findUnique({
          where: { id: plan.subscriptionId },
          select: { source: true },
        })
      : null,
  ]);
  const planSource: RightSource = !subscription
    ? "free"
    : subscription.source === "license"
      ? "license"
      : subscription.source === "admin"
        ? "gift"
        : "plan";
  const overrideOf = new Map(overrides.map((override) => [override.key, override]));
  const types = new Map(entitlements.map((row) => [row.key, row.type]));
  for (const override of overrides) if (!types.has(override.key)) types.set(override.key, "limit");

  const rows: RightRow[] = await Promise.all(
    [...types].map(async ([key, type]) => {
      const override = overrideOf.get(key) ?? null;
      const quota = type === "limit" && key.endsWith(".monthly");
      return {
        key,
        type,
        value: plan.values[key] ?? "",
        source: override ? "override" : planSource,
        override: override
          ? { id: override.id, reason: override.reason, expiresAt: override.expiresAt }
          : null,
        used: quota ? (await usage(db, subject, key, now)).used : null,
      };
    }),
  );
  return { plan, source: planSource, rows };
}

/** Plans an administrator can give to a person: active, paid talent plans. */
export async function grantablePlans(db: PrismaClient) {
  return db.plan.findMany({
    where: { family: "talent", active: true, priceCents: { gt: 0 } },
    orderBy: { sortOrder: "asc" },
    select: { code: true, name: true },
  });
}

/** Plans given by hand that are still running (they can be withdrawn). */
export async function grantedPlans(db: PrismaClient, userId: string, now = new Date()) {
  return db.subscription.findMany({
    where: {
      subjectType: "user",
      subjectId: userId,
      source: "admin",
      status: "sponsored",
      currentPeriodEnd: { gt: now },
    },
    orderBy: { currentPeriodEnd: "desc" },
    select: { id: true, currentPeriodEnd: true, plan: { select: { name: true } } },
  });
}

/** « 2026-12-31 » → end of that day (UTC), between tomorrow and two years from now. */
export function parseUntil(value: string, now: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (
    value <= now.toISOString().slice(0, 10) ||
    date.getTime() > now.getTime() + GRANT_MAX_DAYS * DAY
  )
    return null;
  return date;
}

const reasonField = z.string().trim().min(3).max(500);

export const grantPlanSchema = z.object({
  userId: z.string().min(1),
  planCode: z.string().min(1).max(60),
  until: z.string(),
  reason: reasonField,
});

/** « Offrir un forfait » until a date: a sponsored subscription, `source = admin`. */
export async function grantPlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof grantPlanSchema>,
  now = new Date(),
) {
  const until = parseUntil(input.until, now);
  if (!until) throw new AdminUserError("until");
  const [user, plan] = await Promise.all([
    db.user.findUnique({ where: { id: input.userId }, select: { status: true } }),
    db.plan.findUnique({ where: { code: input.planCode } }),
  ]);
  if (!user) throw new AdminUserError("notFound");
  if (user.status === "deleted") throw new AdminUserError("deleted");
  if (!plan || plan.family !== "talent" || !plan.active || !plan.priceCents)
    throw new AdminUserError("plan");
  const subscription = await db.subscription.create({
    data: {
      subjectType: "user",
      subjectId: input.userId,
      planId: plan.id,
      status: "sponsored",
      source: "admin",
      currentPeriodStart: now,
      currentPeriodEnd: until,
    },
  });
  invalidate({ type: "user", id: input.userId });
  await audit(db, context, "user.plan.grant", input.userId, {
    plan: plan.code,
    until: until.toISOString(),
    subscriptionId: subscription.id,
    reason: input.reason,
  });
  return subscription;
}

export const revokePlanSchema = z.object({
  userId: z.string().min(1),
  subscriptionId: z.string().min(1),
  reason: reasonField,
});

/** « Retirer le forfait offert »: only plans given by hand; paid and licence plans stay. */
export async function revokePlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof revokePlanSchema>,
  now = new Date(),
) {
  const subscription = await db.subscription.findUnique({
    where: { id: input.subscriptionId },
    include: { plan: { select: { code: true } } },
  });
  if (
    !subscription ||
    subscription.subjectType !== "user" ||
    subscription.subjectId !== input.userId ||
    subscription.source !== "admin" ||
    subscription.status !== "sponsored"
  )
    throw new AdminUserError("grant");
  await db.subscription.update({
    where: { id: subscription.id },
    data: { status: "expired", currentPeriodEnd: now },
  });
  invalidate({ type: "user", id: input.userId });
  await audit(db, context, "user.plan.revoke", input.userId, {
    plan: subscription.plan.code,
    subscriptionId: subscription.id,
    reason: input.reason,
  });
}

export const addCreditsSchema = z.object({
  userId: z.string().min(1),
  key: z
    .string()
    .regex(/^[a-z0-9_.]+\.monthly$/)
    .max(80),
  amount: z.coerce.number().int().min(1).max(CREDITS_MAX),
  until: z.string(),
  reason: reasonField,
});

/**
 * « Ajouter des crédits »: raises a quota of the period by `amount` until a date, through an
 * `EntitlementOverride` (one per key: a new gift replaces the previous one and adds to it).
 */
export async function addCredits(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof addCreditsSchema>,
  now = new Date(),
) {
  const until = parseUntil(input.until, now);
  if (!until) throw new AdminUserError("until");
  const subject = { type: "user" as const, id: input.userId };
  invalidate(subject);
  const plan = await resolvePlan(db, subject, now);
  if (!plan) throw new AdminUserError("notFound");
  if (!(input.key in plan.values)) throw new AdminUserError("quota");
  const current = parseLimit(plan.values[input.key]);
  if (current < 0) throw new AdminUserError("unlimited");
  const value = String(current + input.amount);
  await db.$transaction([
    db.entitlementOverride.deleteMany({
      where: { subjectType: "user", subjectId: input.userId, key: input.key },
    }),
    db.entitlementOverride.create({
      data: {
        subjectType: "user",
        subjectId: input.userId,
        key: input.key,
        value,
        reason: input.reason,
        expiresAt: until,
      },
    }),
  ]);
  invalidate(subject);
  await audit(db, context, "user.quota.add", input.userId, {
    key: input.key,
    amount: input.amount,
    from: current,
    to: Number(value),
    until: until.toISOString(),
    reason: input.reason,
  });
}

export const removeOverrideSchema = z.object({
  userId: z.string().min(1),
  overrideId: z.string().min(1),
  reason: reasonField,
});

/** « Retirer » an extra: the plan's value applies again. */
export async function removeOverride(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof removeOverrideSchema>,
) {
  const override = await db.entitlementOverride.findUnique({ where: { id: input.overrideId } });
  if (!override || override.subjectType !== "user" || override.subjectId !== input.userId)
    throw new AdminUserError("quota");
  await db.entitlementOverride.delete({ where: { id: override.id } });
  invalidate({ type: "user", id: input.userId });
  await audit(db, context, "user.quota.remove", input.userId, {
    key: override.key,
    value: override.value,
    reason: input.reason,
  });
}

// ─── Suppression du compte ────────────────────────────────────────

/**
 * Why an account cannot be deleted: one's own account, the last platform administrator, or the
 * owner of an organization (who must hand it over first, as in Paramètres).
 */
export function deletionBlock(input: {
  actorId: string | null;
  targetId: string;
  targetRole: string;
  otherAdmins: number;
  ownsOrganization: boolean;
  status: string;
}): "self" | "lastAdmin" | "owner" | "deleted" | null {
  if (input.status === "deleted") return "deleted";
  if (input.actorId === input.targetId) return "self";
  if (input.targetRole === "platform_admin" && input.otherAdmins === 0) return "lastAdmin";
  if (input.ownsOrganization) return "owner";
  return null;
}

async function blockFor(db: PrismaClient, actorId: string | null, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, platformRole: true, status: true },
  });
  if (!user) return { user: null, block: "notFound" as const };
  const [otherAdmins, owned] = await Promise.all([
    db.user.count({
      where: { platformRole: "platform_admin", status: "active", id: { not: userId } },
    }),
    db.membership.count({ where: { userId, role: "org_owner", status: "active" } }),
  ]);
  const block = deletionBlock({
    actorId,
    targetId: userId,
    targetRole: user.platformRole,
    otherAdmins,
    ownsOrganization: owned > 0,
    status: user.status,
  });
  return { user, block };
}

export async function deletionCheck(db: PrismaClient, actorId: string, userId: string) {
  return (await blockFor(db, actorId, userId)).block;
}

/**
 * Anonymization (partie 10): the account row stays, so applications, payments, certificates and
 * the journal keep their links, but nothing left identifies the person. Applications are kept
 * without cover letter or CV copy; the profile, CVs, experiences and history are deleted.
 */
export async function anonymizeUser(db: PrismaClient, userId: string) {
  const profile = await db.talentProfile.findUnique({ where: { userId }, select: { id: true } });
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new AdminUserError("notFound");
  const profileWrites = profile
    ? [
        db.application.updateMany({
          where: { profileId: profile.id },
          data: { coverLetter: null, cvSnapshot: Prisma.DbNull },
        }),
        db.experience.deleteMany({ where: { profileId: profile.id } }),
        db.education.deleteMany({ where: { profileId: profile.id } }),
        db.document.deleteMany({ where: { profileId: profile.id } }),
        db.profileSkill.deleteMany({ where: { profileId: profile.id } }),
        db.matchResult.deleteMany({ where: { profileId: profile.id } }),
        db.talentPoolEntry.deleteMany({ where: { profileId: profile.id } }),
        db.contactRequest.deleteMany({ where: { profileId: profile.id } }),
        db.talentProfile.update({
          where: { id: profile.id },
          data: {
            headline: null,
            summary: null,
            goal: null,
            targetJob: null,
            visibility: "private",
            availableFrom: null,
            notice: null,
            desiredJobTitles: [],
            desiredContracts: [],
            desiredLocations: [],
            remotePreferences: [],
            salaryMin: null,
            sectors: [],
            languages: [],
            matchingEnabled: false,
            acceptsContactRequests: false,
            portfolioSlug: null,
            portfolioPublic: false,
            portfolioIntro: null,
          },
        }),
      ]
    : [];
  await db.$transaction([
    ...profileWrites,
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.twoFactor.deleteMany({ where: { userId } }),
    db.verification.deleteMany({ where: { identifier: { contains: user.email } } }),
    db.notification.deleteMany({ where: { userId } }),
    db.savedJob.deleteMany({ where: { userId } }),
    db.savedCourse.deleteMany({ where: { userId } }),
    db.lessonNote.deleteMany({ where: { userId } }),
    db.careerDiagnosticDraft.deleteMany({ where: { userId } }),
    db.careerDiagnostic.deleteMany({ where: { userId } }),
    db.progressPlan.deleteMany({ where: { userId } }),
    db.aiSuggestion.deleteMany({ where: { userId } }),
    db.interviewSession.deleteMany({ where: { userId } }),
    db.membership.deleteMany({ where: { userId } }),
    db.license.updateMany({ where: { userId }, data: { invitedEmail: null } }),
    db.user.update({
      where: { id: userId },
      data: {
        name: "—",
        email: `supprime-${userId}@compte-supprime.invalid`,
        emailVerified: false,
        image: null,
        firstName: null,
        lastName: null,
        country: null,
        city: null,
        aiConsentAt: null,
        newsletter: false,
        deletionScheduledAt: null,
        twoFactorEnabled: false,
        platformRole: "user",
        status: "deleted",
      },
    }),
  ]);
  invalidate({ type: "user", id: userId });
}

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
  reason: reasonField,
  confirmEmail: z.string().trim().max(320),
});

/** « Supprimer le compte » (second step): the e-mail typed must match the account's. */
export async function deleteUser(
  db: PrismaClient,
  context: AuditContext & { actorId: string },
  input: z.infer<typeof deleteUserSchema>,
) {
  const { user, block } = await blockFor(db, context.actorId, input.userId);
  if (block) throw new AdminUserError(block);
  if (!user || user.email.toLowerCase() !== input.confirmEmail.toLowerCase())
    throw new AdminUserError("confirm");
  await anonymizeUser(db, input.userId);
  await audit(db, context, "user.delete", input.userId, { reason: input.reason });
}

export const ERASE_WORD = "EFFACER";

export const eraseUserSchema = z.object({
  userId: z.string().min(1),
  reason: reasonField,
  confirmWord: z.string().trim().max(40),
});

/**
 * « Effacer définitivement » (veto of the platform administrator): the account and everything it
 * holds (profile, CVs, documents, applications, posts, messages) are deleted for good, even an
 * account already anonymized or the owner of an organization. Only one's own account and the last
 * administrator are protected. The journal keeps the reason, never the person's data.
 */
export async function eraseUserForGood(
  db: PrismaClient,
  context: AuditContext & { actorId: string },
  input: z.infer<typeof eraseUserSchema>,
) {
  if (input.confirmWord.toUpperCase() !== ERASE_WORD) throw new AdminUserError("confirm");
  const { user, block } = await blockFor(db, context.actorId, input.userId);
  if (!user) throw new AdminUserError("notFound");
  if (block === "self" || block === "lastAdmin") throw new AdminUserError(block);
  await eraseAccountByAdmin(db, input.userId);
  await audit(db, context, "user.erase.veto", input.userId, { reason: input.reason });
}

/**
 * Deletions asked from Paramètres (30 days of grace): carried out by the hourly job. An owner who
 * still holds an organization keeps their account until they hand it over.
 */
export async function purgeScheduledDeletions(
  db: PrismaClient,
  now = new Date(),
  /** Limits the run to these accounts (tests share the database). */
  only?: string[],
) {
  const due = await db.user.findMany({
    where: {
      deletionScheduledAt: { lte: now },
      status: { not: "deleted" },
      ...(only ? { id: { in: only } } : {}),
    },
    select: { id: true },
    take: 200,
  });
  let deleted = 0;
  for (const { id } of due) {
    const { block } = await blockFor(db, null, id);
    if (block) continue;
    await anonymizeUser(db, id);
    await audit(db, { actorId: null }, "user.delete", id, { reason: "scheduled" });
    deleted += 1;
  }
  return deleted;
}

/** Users chosen in the list (or the whole filtered list), for the CSV export. */
export const EXPORT_MAX = 5000;

// ─── Liste ────────────────────────────────────────────────────────

export const USER_STATES = [
  "active",
  "unverified",
  "suspended",
  "deletionScheduled",
  "deleted",
] as const;
export type UserState = (typeof USER_STATES)[number];
export const PLATFORM_ROLES = [
  "user",
  "content_editor",
  "support_agent",
  "platform_admin",
] as const;

export function userState(user: {
  status: string;
  deletionScheduledAt: Date | null;
  emailVerified: boolean;
}): UserState {
  if (user.status === "deleted") return "deleted";
  if (user.status === "suspended") return "suspended";
  if (user.deletionScheduledAt) return "deletionScheduled";
  return user.emailVerified ? "active" : "unverified";
}

export type UserFilters = {
  q: string;
  planCode: string;
  role: (typeof PLATFORM_ROLES)[number] | undefined;
  state: UserState | undefined;
  country: string;
};

function one(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** Filters of `/admin/utilisateurs` (and its CSV export), from the address. */
export function readUserFilters(params: Record<string, unknown>): UserFilters {
  return {
    q: one(params.q).trim().slice(0, 120),
    planCode: one(params.forfait).slice(0, 60),
    role: PLATFORM_ROLES.find((value) => value === params.role),
    state: USER_STATES.find((value) => value === params.statut),
    country: one(params.pays).slice(0, 2).toUpperCase(),
  };
}

const LIVE = ["sponsored", "active", "trialing", "past_due", "canceled"] as const;

/** The Prisma filter of the list. Deleted accounts only show under their own status. */
export async function userListWhere(
  db: PrismaClient,
  filters: UserFilters,
  now = new Date(),
): Promise<Prisma.UserWhereInput> {
  const { q, role, state, country } = filters;
  const and: Prisma.UserWhereInput[] = [];
  if (q)
    and.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { id: q },
      ],
    });
  if (role) and.push({ platformRole: role });
  if (country) and.push({ country });
  if (state === "deleted") and.push({ status: "deleted" });
  else and.push({ status: { not: "deleted" } });
  if (state === "suspended") and.push({ status: "suspended" });
  if (state === "deletionScheduled")
    and.push({ status: "active", deletionScheduledAt: { not: null } });
  if (state === "active" || state === "unverified")
    and.push({ status: "active", deletionScheduledAt: null, emailVerified: state === "active" });
  const plan = filters.planCode
    ? await db.plan.findFirst({
        where: { code: filters.planCode, family: "talent", active: true },
        select: { code: true, priceCents: true },
      })
    : null;
  if (plan) {
    // Same window as the entitlement engine: live subscriptions, grace period included.
    const live = await db.subscription.findMany({
      where: {
        subjectType: "user",
        status: { in: [...LIVE] },
        currentPeriodStart: { lte: now },
        currentPeriodEnd: { gt: new Date(now.getTime() - GRACE_DAYS * DAY) },
        ...(plan.priceCents === 0 ? {} : { plan: { code: plan.code } }),
      },
      select: { subjectId: true },
    });
    const ids = live.map((row) => row.subjectId);
    and.push(plan.priceCents === 0 ? { id: { notIn: ids } } : { id: { in: ids } });
  }
  return { AND: and };
}
