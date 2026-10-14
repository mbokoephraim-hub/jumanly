/**
 * Entitlement engine (docs/specifications.md, partie 03 § 3.3). Code asks for an entitlement key,
 * never for a plan: `can(subject, "career.linkedin")`, `consume(subject, "ai.credits.monthly")`.
 *
 * Resolution: the highest running plan (a sponsored licence wins a tie, partie 05 § 6; a payment in
 * grace comes last) > free plan of the family, then per-subject overrides. Resolved values are cached 60 s in memory and invalidated on every
 * subscription or plan change.
 */
import type { PlanFamily, PrismaClient, SubjectType } from "@/generated/prisma/client";
import { GRACE_DAYS, addMonths, effectiveStatus, periodAround } from "./periods";

export type Subject = { type: SubjectType; id: string };

export class QuotaExceededError extends Error {
  constructor(
    readonly key: string,
    readonly limit: number,
    readonly resetsAt: Date,
  ) {
    super(`Quota atteint pour ${key}`);
    this.name = "QuotaExceededError";
  }
}

export type ResolvedPlan = {
  planId: string;
  planCode: string;
  planName: string;
  family: PlanFamily;
  contentKey: string;
  priceCents: number | null;
  subscriptionId: string | null;
  status: "free" | "trialing" | "active" | "past_due" | "canceled" | "sponsored";
  /** Current quota period (rolling month from the subscription start, or from account creation). */
  periodStart: Date;
  periodEnd: Date;
  values: Record<string, string>;
};

const TTL_MS = 60_000;
const cache = new Map<string, { expires: number; plan: ResolvedPlan }>();

const keyOf = (subject: Subject) => `${subject.type}:${subject.id}`;

export function invalidate(subject?: Subject) {
  if (subject) cache.delete(keyOf(subject));
  else cache.clear();
}

/** Plan family of the free fallback: a person is a talent; an organization starts with RH Free. */
export async function freeFamily(db: PrismaClient, subject: Subject): Promise<PlanFamily | null> {
  if (subject.type === "user") return "talent";
  const org = await db.organization.findUnique({
    where: { id: subject.id },
    select: { type: true },
  });
  if (!org) return null;
  return org.type === "partner" ? "partner" : "rh";
}

/** The free plan a subject falls back to (Free, RH Free…), with its limits. */
export async function freePlan(db: PrismaClient, subject: Subject) {
  const family = await freeFamily(db, subject);
  if (!family) return null;
  return db.plan.findFirst({
    where: { family, priceCents: 0, active: true },
    orderBy: { sortOrder: "asc" },
    include: { entitlements: true },
  });
}

async function anchorDate(db: PrismaClient, subject: Subject): Promise<Date> {
  const row =
    subject.type === "user"
      ? await db.user.findUnique({ where: { id: subject.id }, select: { createdAt: true } })
      : await db.organization.findUnique({
          where: { id: subject.id },
          select: { createdAt: true },
        });
  return row?.createdAt ?? new Date(0);
}

const statusRank = { sponsored: 0, active: 0, trialing: 0, canceled: 0, past_due: 1 } as const;

export async function resolvePlan(
  db: PrismaClient,
  subject: Subject,
  now = new Date(),
): Promise<ResolvedPlan | null> {
  const cached = cache.get(keyOf(subject));
  if (cached && cached.expires > now.getTime() && cached.plan.periodEnd > now) return cached.plan;

  const subscriptions = await db.subscription.findMany({
    where: {
      subjectType: subject.type,
      subjectId: subject.id,
      status: { in: ["sponsored", "active", "trialing", "past_due", "canceled"] },
      currentPeriodEnd: { gt: new Date(now.getTime() - GRACE_DAYS * 86_400_000) },
      // A renewal paid in advance into another plan starts later.
      currentPeriodStart: { lte: now },
    },
    include: { plan: { include: { entitlements: true } } },
  });
  const live = subscriptions
    .map((subscription) => ({ subscription, status: effectiveStatus(subscription, now) }))
    .filter((entry) => entry.status !== "expired" && entry.subscription.plan.active)
    .sort(
      (a, b) =>
        statusRank[a.status as keyof typeof statusRank] -
          statusRank[b.status as keyof typeof statusRank] ||
        (b.subscription.plan.priceCents ?? 0) - (a.subscription.plan.priceCents ?? 0) ||
        Number(b.status === "sponsored") - Number(a.status === "sponsored"),
    );

  let resolved: ResolvedPlan | null = null;
  const chosen = live[0];
  if (chosen) {
    const { subscription, status } = chosen;
    const period = periodAround(subscription.currentPeriodStart, now);
    resolved = {
      planId: subscription.plan.id,
      planCode: subscription.plan.code,
      planName: subscription.plan.name,
      family: subscription.plan.family,
      contentKey: subscription.plan.contentKey,
      priceCents: subscription.plan.priceCents,
      subscriptionId: subscription.id,
      status: status as ResolvedPlan["status"],
      periodStart: period.start,
      periodEnd: period.end,
      values: Object.fromEntries(subscription.plan.entitlements.map((e) => [e.key, e.value])),
    };
  } else {
    const family = await freeFamily(db, subject);
    const free = family
      ? await db.plan.findFirst({
          where: { family, priceCents: 0, active: true },
          orderBy: { sortOrder: "asc" },
          include: { entitlements: true },
        })
      : null;
    if (!free) return null;
    const period = periodAround(await anchorDate(db, subject), now);
    resolved = {
      planId: free.id,
      planCode: free.code,
      planName: free.name,
      family: free.family,
      contentKey: free.contentKey,
      priceCents: free.priceCents,
      subscriptionId: null,
      status: "free",
      periodStart: period.start,
      periodEnd: period.end,
      values: Object.fromEntries(free.entitlements.map((e) => [e.key, e.value])),
    };
  }

  const overrides = await db.entitlementOverride.findMany({
    where: {
      subjectType: subject.type,
      subjectId: subject.id,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "asc" },
  });
  for (const override of overrides) resolved.values[override.key] = override.value;

  cache.set(keyOf(subject), { expires: now.getTime() + TTL_MS, plan: resolved });
  return resolved;
}

async function valueOf(db: PrismaClient, subject: Subject, key: string) {
  return (await resolvePlan(db, subject))?.values[key];
}

/** Feature switch. Unknown keys are off. */
export async function can(db: PrismaClient, subject: Subject, key: string): Promise<boolean> {
  return (await valueOf(db, subject, key)) === "true";
}

/** Level of a feature, "none" when not included. */
export async function level(db: PrismaClient, subject: Subject, key: string): Promise<string> {
  return (await valueOf(db, subject, key)) ?? "none";
}

/**
 * Capacity or quota: -1 = unlimited, 0 = none. "contract" without an override for the subject
 * means nothing has been negotiated yet, so 0.
 */
export function parseLimit(value: string | undefined): number {
  if (value === undefined || value === "contract") return 0;
  const number = Number(value);
  return Number.isInteger(number) ? number : 0;
}

export async function limit(db: PrismaClient, subject: Subject, key: string): Promise<number> {
  return parseLimit(await valueOf(db, subject, key));
}

export type Usage = { used: number; limit: number; resetsAt: Date };

export async function usage(
  db: PrismaClient,
  subject: Subject,
  key: string,
  now = new Date(),
): Promise<Usage> {
  const plan = await resolvePlan(db, subject, now);
  const max = parseLimit(plan?.values[key]);
  if (!plan) return { used: 0, limit: 0, resetsAt: now };
  const counter = await db.usageCounter.findUnique({
    where: {
      subjectType_subjectId_key_periodStart: {
        subjectType: subject.type,
        subjectId: subject.id,
        key,
        periodStart: plan.periodStart,
      },
    },
  });
  return { used: counter?.used ?? 0, limit: max, resetsAt: plan.periodEnd };
}

/**
 * Uses `amount` of a quota, atomically: the counter only moves if the result stays within the
 * limit. Throws QuotaExceededError otherwise. Never call it for applying to a job (CLAUDE.md § 1).
 */
export async function consume(
  db: PrismaClient,
  subject: Subject,
  key: string,
  amount = 1,
  now = new Date(),
): Promise<Usage> {
  const plan = await resolvePlan(db, subject, now);
  const max = parseLimit(plan?.values[key]);
  if (!plan || max === 0) throw new QuotaExceededError(key, 0, plan?.periodEnd ?? now);
  const where = {
    subjectType: subject.type,
    subjectId: subject.id,
    key,
    periodStart: plan.periodStart,
  };
  await db.usageCounter.upsert({
    where: { subjectType_subjectId_key_periodStart: where },
    update: {},
    create: { ...where, periodEnd: plan.periodEnd, used: 0 },
  });
  const updated = await db.usageCounter.updateMany({
    where: max < 0 ? where : { ...where, used: { lte: max - amount } },
    data: { used: { increment: amount } },
  });
  if (updated.count === 0) throw new QuotaExceededError(key, max, plan.periodEnd);
  return usage(db, subject, key, now);
}

/**
 * Gives back what `consume` took when the work it paid for did not happen (an AI call that
 * failed: « Aucun crédit n'a été utilisé »). Never below zero.
 */
export async function release(
  db: PrismaClient,
  subject: Subject,
  key: string,
  amount = 1,
  now = new Date(),
) {
  const plan = await resolvePlan(db, subject, now);
  if (!plan) return;
  await db.usageCounter.updateMany({
    where: {
      subjectType: subject.type,
      subjectId: subject.id,
      key,
      periodStart: plan.periodStart,
      used: { gte: amount },
    },
    data: { used: { decrement: amount } },
  });
}

export { addMonths, GRACE_DAYS };
