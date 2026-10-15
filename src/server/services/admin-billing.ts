/**
 * Jumanly Admin v2 · forfaits et abonnements (docs/admin-v2/PLAN-ADMIN.md, étape 5). Plans are
 * created, duplicated, withdrawn or deleted here; a subscription is extended, moved to another
 * plan, cancelled or paid by hand. Every change goes through the billing rules of partie 09
 * (`applyPaymentStatus` for a payment, `returnedToFree` for an immediate end), carries a reason
 * and is written in `AuditLog`. This file never names a plan (CLAUDE.md § 2).
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  PaymentMethod,
  PlanFamily,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
} from "@/generated/prisma/client";
import { MANUAL_METHODS } from "@/lib/payment-method";
import { invalidate, type Subject } from "@/server/entitlements";
import { addMonths, effectiveStatus } from "@/server/entitlements/periods";
import { returnedToFree } from "./billing-events";
import { applyPaymentStatus, subjectFamilies } from "./subscriptions";

const DAY_MS = 86_400_000;
/** An extension or a manual period never goes beyond two years. */
export const MAX_DAYS_AHEAD = 730;

export class AdminBillingError extends Error {
  constructor(
    readonly code:
      | "notFound"
      | "code"
      | "taken"
      | "used"
      | "free"
      | "status"
      | "date"
      | "plan"
      | "same"
      | "amount"
      | "reference",
  ) {
    super(code);
    this.name = "AdminBillingError";
  }
}

type AuditContext = { actorId: string; ip?: string | null };

async function audit(
  db: PrismaClient,
  context: AuditContext,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Prisma.InputJsonValue,
) {
  await db.auditLog.create({
    data: {
      actorId: context.actorId,
      action,
      targetType,
      targetId,
      metadata,
      ip: context.ip ?? null,
    },
  });
}

const reasonField = z.string().trim().min(3).max(1000);

// ─── Plans ─────────────────────────────────────────────────────────────────────

export const PLAN_FAMILIES = ["talent", "rh", "company", "partner"] as const;

/** `talent_pro_2027`: lower case, digits and « _ », 3 to 40 characters. */
const planCode = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z][a-z0-9_]{2,39}$/);

export const newPlanSchema = z.object({
  family: z.enum(PLAN_FAMILIES),
  code: planCode,
  name: z.string().trim().min(1).max(60),
  reason: reasonField,
});

export const duplicatePlanSchema = z.object({
  source: z.string().min(1),
  code: planCode,
  name: z.string().trim().min(1).max(60),
  reason: reasonField,
});

/**
 * Where a copy starts: hidden, not sold, not recommended, last of its family, price « on quote »
 * for a new plan (so it can never be taken for the family's free plan before it is checked).
 */
async function insertPlan(
  db: PrismaClient,
  input: {
    family: PlanFamily;
    code: string;
    name: string;
    tagline: string;
    contentKey: string;
    priceCents: number | null;
    interval: string;
    entitlements: { key: string; type: "boolean" | "limit" | "level"; value: string }[];
  },
) {
  if (await db.plan.findUnique({ where: { code: input.code }, select: { id: true } }))
    throw new AdminBillingError("taken");
  const last = await db.plan.aggregate({
    where: { family: input.family },
    _max: { sortOrder: true },
  });
  return db.plan.create({
    data: {
      family: input.family,
      code: input.code,
      name: input.name,
      tagline: input.tagline,
      contentKey: input.contentKey,
      priceCents: input.priceCents,
      interval: input.interval,
      isPublic: false,
      isPurchasable: false,
      recommended: false,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      entitlements: { create: input.entitlements },
    },
  });
}

/**
 * « Nouveau forfait »: the rights of the family's first plan as a starting point (every key is
 * there, at the lowest values), then the administrator sets them before putting it on sale.
 */
export async function createPlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof newPlanSchema>,
) {
  const base = await db.plan.findFirst({
    where: { family: input.family },
    orderBy: { sortOrder: "asc" },
    include: { entitlements: true },
  });
  if (!base) throw new AdminBillingError("notFound");
  const plan = await insertPlan(db, {
    family: input.family,
    code: input.code,
    name: input.name,
    tagline: "",
    contentKey: base.contentKey,
    priceCents: null,
    interval: base.interval,
    entitlements: base.entitlements.map(({ key, type, value }) => ({ key, type, value })),
  });
  await audit(db, context, "plan.create", "plan", plan.id, {
    code: plan.code,
    from: base.code,
    reason: input.reason,
  });
  return plan;
}

/** « Dupliquer »: the same price and rights, hidden and not sold until it is checked. */
export async function duplicatePlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof duplicatePlanSchema>,
) {
  const source = await db.plan.findUnique({
    where: { code: input.source },
    include: { entitlements: true },
  });
  if (!source) throw new AdminBillingError("notFound");
  const plan = await insertPlan(db, {
    family: source.family,
    code: input.code,
    name: input.name,
    tagline: source.tagline,
    contentKey: source.contentKey,
    priceCents: source.priceCents,
    interval: source.interval,
    entitlements: source.entitlements.map(({ key, type, value }) => ({ key, type, value })),
  });
  await audit(db, context, "plan.duplicate", "plan", plan.id, {
    code: plan.code,
    from: source.code,
    reason: input.reason,
  });
  return plan;
}

/** What keeps a plan from being deleted: anyone ever on it, or being the family's free plan. */
export async function planUsage(db: PrismaClient, planId: string) {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      family: true,
      priceCents: true,
      active: true,
      _count: {
        select: { subscriptions: true, pendingFor: true, payments: true, licenseBatches: true },
      },
    },
  });
  if (!plan) return null;
  const free = await db.plan.findFirst({
    where: { family: plan.family, priceCents: 0, active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const { subscriptions, pendingFor, payments, licenseBatches } = plan._count;
  return {
    used: subscriptions + pendingFor + payments + licenseBatches > 0,
    isFree: free?.id === plan.id,
    subscriptions,
  };
}

export const planReasonSchema = z.object({ code: z.string().min(1), reason: reasonField });

/** « Retirer de la vente »: subscribers keep it until their term; nobody new can take it. */
export async function withdrawPlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof planReasonSchema>,
) {
  const plan = await db.plan.findUnique({ where: { code: input.code } });
  if (!plan) throw new AdminBillingError("notFound");
  const usage = await planUsage(db, plan.id);
  if (usage?.isFree) throw new AdminBillingError("free");
  await db.plan.update({
    where: { id: plan.id },
    data: { isPublic: false, isPurchasable: false, recommended: false },
  });
  await audit(db, context, "plan.withdraw", "plan", plan.id, {
    code: plan.code,
    reason: input.reason,
  });
  invalidate();
  return plan;
}

/** Deleting is only for a plan nobody ever had (a draft or a mistaken copy). */
export async function deletePlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof planReasonSchema>,
) {
  const plan = await db.plan.findUnique({ where: { code: input.code } });
  if (!plan) throw new AdminBillingError("notFound");
  const usage = await planUsage(db, plan.id);
  if (usage?.used) throw new AdminBillingError("used");
  if (usage?.isFree) throw new AdminBillingError("free");
  await db.$transaction([
    db.planEntitlement.deleteMany({ where: { planId: plan.id } }),
    db.plan.delete({ where: { id: plan.id } }),
  ]);
  await audit(db, context, "plan.delete", "plan", plan.id, {
    code: plan.code,
    name: plan.name,
    reason: input.reason,
  });
  invalidate();
  return plan;
}

export type PlanVersion = {
  id: string;
  action: string;
  createdAt: Date;
  actor: string | null;
  reason: string | null;
  changes: { field: string; from: string; to: string }[];
};

const fieldNames = [
  "name",
  "tagline",
  "priceCents",
  "sortOrder",
  "isPublic",
  "isPurchasable",
  "recommended",
] as const;

function show(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

/** The versions of a plan with what changed in each (the metadata of `plan.update`). */
export function versionChanges(metadata: Prisma.JsonValue): PlanVersion["changes"] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const data = metadata as Record<string, unknown>;
  const changes: PlanVersion["changes"] = [];
  const fields = (data.fields ?? {}) as Record<string, unknown>;
  const before = (data.before ?? {}) as Record<string, unknown>;
  for (const name of fieldNames) {
    if (!(name in fields)) continue;
    const from = show(before[name]);
    const to = show(fields[name]);
    if (from !== to) changes.push({ field: name, from, to });
  }
  if (Array.isArray(data.entitlements)) {
    for (const item of data.entitlements as { key?: unknown; from?: unknown; to?: unknown }[]) {
      if (typeof item?.key === "string")
        changes.push({ field: item.key, from: show(item.from), to: show(item.to) });
    }
  }
  return changes;
}

export async function planVersions(db: PrismaClient, planId: string, limit = 12) {
  const rows = await db.auditLog.findMany({
    where: { targetType: "plan", targetId: planId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const actors = await db.user.findMany({
    where: { id: { in: rows.map((row) => row.actorId).filter((id): id is string => !!id) } },
    select: { id: true, name: true },
  });
  return rows.map((row): PlanVersion => ({
    id: row.id,
    action: row.action,
    createdAt: row.createdAt,
    actor: actors.find((actor) => actor.id === row.actorId)?.name ?? null,
    reason:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (((row.metadata as Record<string, unknown>).reason as string | undefined) ?? null)
        : null,
    changes: versionChanges(row.metadata),
  }));
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────

/**
 * A date typed as YYYY-MM-DD, after `after` (by at least one day) and at most two years ahead:
 * the end of that day, in UTC.
 */
export function parseEndDate(value: string, after: Date, now: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== value) return null;
  if (date.getTime() <= after.getTime()) return null;
  if (date.getTime() > now.getTime() + MAX_DAYS_AHEAD * DAY_MS) return null;
  return date;
}

async function loadSubscription(db: PrismaClient, id: string) {
  const subscription = await db.subscription.findUnique({
    where: { id },
    include: { plan: true, pendingPlan: true },
  });
  if (!subscription) throw new AdminBillingError("notFound");
  return subscription;
}

const subjectOf = (row: { subjectType: "user" | "organization"; subjectId: string }): Subject => ({
  type: row.subjectType,
  id: row.subjectId,
});

export const extendSchema = z.object({
  subscription: z.string().min(1),
  until: z.string().trim(),
  reason: reasonField,
});

/**
 * « Prolonger »: a later end date. A subscription in its grace period is active again; a
 * cancelled one stays cancelled, only later. A licence is managed from the partner space.
 */
export async function extendSubscription(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof extendSchema>,
  now = new Date(),
) {
  const subscription = await loadSubscription(db, input.subscription);
  if (subscription.source === "license") throw new AdminBillingError("status");
  const status = effectiveStatus(subscription, now);
  const from = subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
  const until = parseEndDate(input.until, from, now);
  if (!until) throw new AdminBillingError("date");
  const nextStatus: SubscriptionStatus =
    status === "past_due" || status === "expired"
      ? subscription.status === "canceled"
        ? "canceled"
        : subscription.status === "trialing" || subscription.status === "sponsored"
          ? subscription.status
          : "active"
      : subscription.status;
  const updated = await db.subscription.update({
    where: { id: subscription.id },
    data: { currentPeriodEnd: until, status: nextStatus },
    include: { plan: true },
  });
  invalidate(subjectOf(subscription));
  await audit(db, context, "subscription.extend", "subscription", subscription.id, {
    from: subscription.currentPeriodEnd.toISOString(),
    to: until.toISOString(),
    reason: input.reason,
  });
  return updated;
}

export const changePlanSchema = z.object({
  subscription: z.string().min(1),
  plan: z.string().min(1),
  when: z.enum(["now", "term"]),
  reason: reasonField,
});

/** Plans this subscription may move to: active, of the holder's families, not its own. */
export async function plansFor(
  db: PrismaClient,
  subscription: { subjectType: "user" | "organization"; subjectId: string; planId: string },
) {
  const families = await subjectFamilies(db, subjectOf(subscription));
  return db.plan.findMany({
    where: { family: { in: families }, active: true, id: { not: subscription.planId } },
    orderBy: [{ family: "asc" }, { sortOrder: "asc" }],
    select: { id: true, code: true, name: true, family: true, priceCents: true },
  });
}

/**
 * « Changer de forfait »: now (the current period goes on with the new plan's rights), or at the
 * term (the plan of the next period, as a downgrade chosen by the holder).
 */
export async function changeSubscriptionPlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof changePlanSchema>,
  now = new Date(),
) {
  const subscription = await loadSubscription(db, input.subscription);
  if (subscription.source === "license") throw new AdminBillingError("status");
  if (effectiveStatus(subscription, now) === "expired") throw new AdminBillingError("status");
  const allowed = await plansFor(db, subscription);
  const plan = allowed.find((item) => item.code === input.plan);
  if (!plan) throw new AdminBillingError(input.plan === subscription.plan.code ? "same" : "plan");
  const updated = await db.subscription.update({
    where: { id: subscription.id },
    data:
      input.when === "now" ? { planId: plan.id, pendingPlanId: null } : { pendingPlanId: plan.id },
    include: { plan: true, pendingPlan: true },
  });
  invalidate(subjectOf(subscription));
  await audit(db, context, "subscription.plan", "subscription", subscription.id, {
    from: subscription.plan.code,
    to: plan.code,
    when: input.when,
    reason: input.reason,
  });
  return { subscription: updated, plan, previous: subscription.plan };
}

export const cancelSchema = z.object({
  subscription: z.string().min(1),
  when: z.enum(["now", "term"]),
  reason: reasonField,
});

/**
 * « Résilier »: at the term (the rights stay until the end of the paid period, as when the holder
 * cancels), or now (back to the free plan at once, with what that does to an organization).
 */
export async function cancelSubscription(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof cancelSchema>,
  now = new Date(),
) {
  const subscription = await loadSubscription(db, input.subscription);
  if (subscription.source === "license") throw new AdminBillingError("status");
  const status = effectiveStatus(subscription, now);
  if (status === "expired") throw new AdminBillingError("status");
  if (input.when === "term" && (status === "canceled" || status === "past_due"))
    throw new AdminBillingError("status");
  const subject = subjectOf(subscription);
  if (input.when === "term") {
    await db.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true, status: "canceled", pendingPlanId: null },
    });
    invalidate(subject);
  } else {
    await db.subscription.update({
      where: { id: subscription.id },
      data: { status: "expired", currentPeriodEnd: now, pendingPlanId: null },
    });
    await returnedToFree(db, subject, subscription.plan.name, now);
  }
  await audit(db, context, "subscription.cancel", "subscription", subscription.id, {
    plan: subscription.plan.code,
    when: input.when,
    reason: input.reason,
  });
  return subscription;
}

export const manualPaymentSchema = z.object({
  subscription: z.string().min(1),
  plan: z.string().min(1),
  method: z.enum(MANUAL_METHODS),
  amount: z
    .string()
    .trim()
    .regex(/^\d+([.,]\d{1,2})?$/),
  months: z.coerce.number().int().min(1).max(24),
  reference: z.string().trim().min(3).max(80),
  reason: reasonField,
});

/**
 * A bank transfer or cash received outside the providers: recorded as a payment of the
 * « manual » provider, then confirmed through `applyPaymentStatus`, so the period, the invoice,
 * the receipt and the notifications are exactly those of an online payment (partie 09 § 9.2).
 */
export async function recordManualPayment(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof manualPaymentSchema>,
  now = new Date(),
) {
  const subscription = await loadSubscription(db, input.subscription);
  const families = await subjectFamilies(db, subjectOf(subscription));
  const plan = await db.plan.findUnique({ where: { code: input.plan } });
  if (!plan || !plan.active || !families.includes(plan.family)) throw new AdminBillingError("plan");
  const amountCents = Math.round(Number(input.amount.replace(",", ".")) * 100);
  if (!(amountCents > 0)) throw new AdminBillingError("amount");
  const providerRef = `manuel:${input.reference}`;
  if (await db.payment.findUnique({ where: { providerRef }, select: { id: true } }))
    throw new AdminBillingError("reference");

  // Same plan, still running and paid: the new period follows it (prepaid). Otherwise from now.
  const status = effectiveStatus(subscription, now);
  const follows =
    subscription.planId === plan.id &&
    subscription.currentPeriodEnd > now &&
    (status === "active" || status === "canceled");
  const periodStart = follows ? subscription.currentPeriodEnd : now;
  const periodEnd = addMonths(periodStart, input.months);
  if (periodEnd.getTime() > now.getTime() + MAX_DAYS_AHEAD * DAY_MS)
    throw new AdminBillingError("date");

  const payment = await db.payment.create({
    data: {
      subjectType: subscription.subjectType,
      subjectId: subscription.subjectId,
      planId: plan.id,
      provider: "manual",
      method: input.method as PaymentMethod,
      amountCents,
      kind: follows ? "renewal" : subscription.planId === plan.id ? "new" : "upgrade",
      payerId: subscription.subjectType === "user" ? subscription.subjectId : null,
      providerRef,
      idempotencyKey: randomUUID(),
      periodStart,
      periodEnd,
    },
  });
  await audit(db, context, "payment.manual", "payment", payment.id, {
    subscription: subscription.id,
    plan: plan.code,
    amountCents,
    method: input.method,
    reference: input.reference,
    reason: input.reason,
  });
  await applyPaymentStatus(db, payment.id, "succeeded", now);
  return db.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { invoice: true } });
}

// ─── Card and indicators ───────────────────────────────────────────────────────

export type TimelineEvent = {
  kind:
    | "created"
    | "paid"
    | "renewed"
    | "failed"
    | "refunded"
    | "late"
    | "canceled"
    | "ended"
    | "admin";
  date: Date;
  /** Admin events: the journal action; payments: the amount in cents. */
  action?: string;
  amountCents?: number;
  reason?: string | null;
  actor?: string | null;
};

/**
 * The subscription's life, oldest first: created, each payment (paid, renewed, failed,
 * refunded), the administrator's changes, then where it stands now (late, cancelled, ended).
 */
export async function subscriptionTimeline(
  db: PrismaClient,
  subscriptionId: string,
  now = new Date(),
) {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, pendingPlan: true },
  });
  if (!subscription) return null;
  const [payments, logs] = await Promise.all([
    db.payment.findMany({
      where: {
        OR: [
          { subscriptionId },
          {
            subscriptionId: null,
            subjectType: subscription.subjectType,
            subjectId: subscription.subjectId,
            planId: subscription.planId,
            createdAt: { gte: subscription.createdAt },
          },
        ],
      },
      include: { invoice: { select: { id: true, number: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.auditLog.findMany({
      where: { targetType: "subscription", targetId: subscriptionId },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const actors = await db.user.findMany({
    where: { id: { in: logs.map((log) => log.actorId).filter((id): id is string => !!id) } },
    select: { id: true, name: true },
  });
  const events: TimelineEvent[] = [{ kind: "created", date: subscription.createdAt }];
  for (const payment of payments) {
    if (payment.status === "succeeded" || payment.status === "refunded")
      events.push({
        kind: payment.kind === "renewal" ? "renewed" : "paid",
        date: payment.paidAt ?? payment.createdAt,
        amountCents: payment.amountCents,
      });
    if (payment.status === "failed")
      events.push({ kind: "failed", date: payment.updatedAt, amountCents: payment.amountCents });
    if (payment.refundedAt)
      events.push({ kind: "refunded", date: payment.refundedAt, amountCents: payment.amountCents });
  }
  for (const log of logs) {
    const metadata = (log.metadata ?? {}) as Record<string, unknown>;
    events.push({
      kind: "admin",
      date: log.createdAt,
      action: log.action,
      reason: typeof metadata.reason === "string" ? metadata.reason : null,
      actor: actors.find((actor) => actor.id === log.actorId)?.name ?? null,
    });
  }
  const status = effectiveStatus(subscription, now);
  if (status === "past_due") events.push({ kind: "late", date: subscription.currentPeriodEnd });
  if (status === "canceled") events.push({ kind: "canceled", date: subscription.updatedAt });
  if (status === "expired")
    events.push({
      kind: "ended",
      date: subscription.currentPeriodEnd < now ? subscription.currentPeriodEnd : now,
    });
  // The payment that opens a subscription is recorded just before it: « Créé » stays first.
  events.sort((a, b) =>
    a.kind === "created" ? -1 : b.kind === "created" ? 1 : a.date.getTime() - b.date.getTime(),
  );
  return { subscription: { ...subscription, status }, payments, events };
}

/**
 * Figures of the subscriptions page: running, late (grace), to renew within 7 days, and the
 * money received this calendar month (refunds of the month deducted).
 */
export async function subscriptionIndicators(db: PrismaClient, now = new Date()) {
  const rows = await db.subscription.findMany({
    where: {
      source: { not: "license" },
      currentPeriodEnd: { gt: new Date(now.getTime() - 30 * DAY_MS) },
    },
    select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });
  const soon = now.getTime() + 7 * DAY_MS;
  let active = 0;
  let late = 0;
  let renewSoon = 0;
  for (const row of rows) {
    const status = effectiveStatus(row, now);
    if (status === "active") {
      active++;
      if (row.currentPeriodEnd.getTime() <= soon) renewSoon++;
    }
    if (status === "past_due") late++;
  }
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [received, refunded] = await Promise.all([
    db.payment.aggregate({
      where: { status: { in: ["succeeded", "refunded"] }, paidAt: { gte: monthStart, lte: now } },
      _sum: { amountCents: true },
    }),
    db.payment.aggregate({
      where: { status: "refunded", refundedAt: { gte: monthStart, lte: now } },
      _sum: { amountCents: true },
    }),
  ]);
  return {
    active,
    late,
    renewSoon,
    revenueCents: (received._sum.amountCents ?? 0) - (refunded._sum.amountCents ?? 0),
  };
}
