/**
 * Subscriptions and payments (docs/specifications.md, parties 05 § 6, 06 § 6.7 and 09).
 * Prepaid periods; the provider's status (webhook or getStatus) is the source of truth, never the
 * browser. Activation is idempotent: a payment activates a plan once.
 */
import { randomUUID } from "node:crypto";
import type { Plan, PlanFamily, PrismaClient, SubjectType } from "@/generated/prisma/client";
import { invalidate, resolvePlan, type Subject } from "@/server/entitlements";
import { addMonths, effectiveStatus } from "@/server/entitlements/periods";
import type { PaymentMethodCode, PaymentProvider, ProviderPaymentStatus } from "@/server/payments";
import { paymentFailed, paymentSucceeded } from "./billing-events";

/** Trial length for paid plans while online payment is not available (before step E7). */
export const TRIAL_DAYS = 14;
/** A Mobile Money request without answer expires after 15 minutes (partie 09 § 9.2). */
export const PAYMENT_EXPIRY_MS = 15 * 60 * 1000;

export async function subjectFamilies(db: PrismaClient, subject: Subject): Promise<PlanFamily[]> {
  if (subject.type === "user") return ["talent"];
  const org = await db.organization.findUnique({
    where: { id: subject.id },
    select: { type: true },
  });
  if (!org || org.type === "partner") return [];
  return ["rh", "company"];
}

/** A plan the subject may buy online: active, purchasable, paid, of the subject's families. */
export async function purchasablePlan(db: PrismaClient, subject: Subject, code: string) {
  const plan = await db.plan.findUnique({ where: { code } });
  if (!plan || !plan.active || !plan.isPurchasable || !plan.priceCents) return null;
  if (!(await subjectFamilies(db, subject)).includes(plan.family)) return null;
  return plan;
}

/** Subscriptions not over yet (paid or trial, never a licence), the latest first. */
async function liveRows(db: PrismaClient, subject: Subject, now: Date) {
  const rows = await db.subscription.findMany({
    where: { subjectType: subject.type, subjectId: subject.id, source: { not: "license" } },
    include: { plan: true, pendingPlan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });
  return rows.filter((row) => effectiveStatus(row, now) !== "expired");
}

/**
 * The subscription in force now (not a licence), if any. A renewal paid in advance into a cheaper
 * plan exists as a subscription starting later: it is not « in force » before its start.
 */
export async function liveSubscription(db: PrismaClient, subject: Subject, now = new Date()) {
  return (await liveRows(db, subject, now)).find((row) => row.currentPeriodStart <= now) ?? null;
}

export type CheckoutKind = "new" | "renewal" | "upgrade";

export type CheckoutQuote = {
  plan: Plan;
  kind: CheckoutKind | "downgrade";
  priceCents: number;
  /** Unused time of the current paid plan, deducted on an upgrade (partie 09 § 9.2). */
  creditCents: number;
  totalCents: number;
  periodStart: Date;
  periodEnd: Date;
};

/** The smallest amount ever asked after a credit: providers refuse a zero payment. */
export const MIN_CHARGE_CENTS = 100;

/**
 * What paying `planCode` now means for this subject:
 * - the same plan: a renewal, from the end of the paid period (prepaid, partie 09 § 9.2);
 * - the cheaper plan scheduled for the next period: a renewal into that plan, from the same date;
 * - a plan at least as expensive while a paid period runs: an upgrade, at once, minus the unused
 *   time of the current plan;
 * - a cheaper plan while a paid period runs: not sold now (`downgrade`, scheduled instead);
 * - otherwise (free, trial, period over): a new subscription from now.
 */
export async function quoteCheckout(
  db: PrismaClient,
  subject: Subject,
  planCode: string,
  now = new Date(),
): Promise<CheckoutQuote | null> {
  const plan = await purchasablePlan(db, subject, planCode);
  if (!plan?.priceCents) return null;
  const priceCents = plan.priceCents;
  const rows = await liveRows(db, subject, now);
  const latest = rows[0];
  const current = rows.find((row) => row.currentPeriodStart <= now);
  const paid = (row?: (typeof rows)[number]) =>
    !!row && row.status !== "trialing" && row.status !== "sponsored";
  const quote = (kind: CheckoutQuote["kind"], start: Date, creditCents = 0): CheckoutQuote => ({
    plan,
    kind,
    priceCents,
    creditCents,
    totalCents: priceCents - creditCents,
    periodStart: start,
    periodEnd: addMonths(start, 1),
  });

  if (paid(latest) && latest!.planId === plan.id) {
    const end = latest!.currentPeriodEnd;
    return quote("renewal", end > now ? end : now);
  }
  if (paid(current) && current!.currentPeriodEnd > now) {
    if (current!.pendingPlanId === plan.id && latest === current) {
      return quote("renewal", current!.currentPeriodEnd);
    }
    const currentPrice = current!.plan.priceCents ?? 0;
    if (priceCents < currentPrice) return quote("downgrade", now);
    const end = current!.currentPeriodEnd;
    const month = end.getTime() - addMonths(end, -1).getTime();
    const unused = Math.round((currentPrice * (end.getTime() - now.getTime())) / month);
    const credit = Math.max(0, Math.min(unused, priceCents - MIN_CHARGE_CENTS));
    return quote("upgrade", now, credit);
  }
  return quote("new", now);
}

export type CheckoutResult =
  { status: "started"; paymentId: string } | { status: "duplicate" } | { status: "unavailable" };

export async function startCheckout(
  db: PrismaClient,
  provider: PaymentProvider,
  input: {
    subject: Subject;
    planCode: string;
    method: PaymentMethodCode;
    payerId?: string;
    email: string;
    country: string;
    msisdn?: string;
    operator?: string;
    returnUrl: string;
  },
  now = new Date(),
): Promise<CheckoutResult> {
  const quote = await quoteCheckout(db, input.subject, input.planCode, now);
  if (!quote || quote.kind === "downgrade") return { status: "unavailable" };

  const pending = await db.payment.findFirst({
    where: {
      subjectType: input.subject.type,
      subjectId: input.subject.id,
      status: "pending",
      createdAt: { gt: new Date(now.getTime() - PAYMENT_EXPIRY_MS) },
    },
  });
  if (pending) return { status: "duplicate" };

  const idempotencyKey = randomUUID();
  const created = await provider.createPayment({
    amountCents: quote.totalCents,
    currency: "USD",
    reference: idempotencyKey,
    method: input.method,
    customer: {
      email: input.email,
      msisdn: input.msisdn,
      operator: input.operator,
      country: input.country,
    },
    returnUrl: input.returnUrl,
    idempotencyKey,
  });
  const payment = await db.payment.create({
    data: {
      subjectType: input.subject.type,
      subjectId: input.subject.id,
      planId: quote.plan.id,
      provider: provider.id,
      method: input.method,
      operator: input.operator,
      msisdnMasked: input.msisdn ? maskNumber(input.msisdn) : null,
      amountCents: quote.totalCents,
      creditCents: quote.creditCents,
      kind: quote.kind,
      payerId: input.payerId,
      providerRef: created.providerRef,
      idempotencyKey,
      periodStart: quote.periodStart,
      periodEnd: quote.periodEnd,
    },
  });
  return { status: "started", paymentId: payment.id };
}

export function maskNumber(msisdn: string): string {
  const digits = msisdn.replace(/\D/g, "");
  return `••••••${digits.slice(-4)}`;
}

/**
 * Asks the provider where a payment stands and applies the result. Safe to call repeatedly
 * (page refresh, webhook and polling at the same time): only a pending payment can change.
 */
export async function refreshPayment(
  db: PrismaClient,
  provider: PaymentProvider,
  paymentId: string,
  now = new Date(),
) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "pending") return payment;
  let status = await provider.getStatus(payment.providerRef);
  if (status === "pending" && now.getTime() - payment.createdAt.getTime() > PAYMENT_EXPIRY_MS) {
    status = "expired";
  }
  return applyPaymentStatus(db, payment.id, status, now);
}

/**
 * The one place where a provider's answer (webhook or `getStatus`) changes a payment. Only a
 * pending payment moves, so a replayed answer never activates twice nor sends two e-mails.
 */
export async function applyPaymentStatus(
  db: PrismaClient,
  paymentId: string,
  status: ProviderPaymentStatus,
  now = new Date(),
) {
  if (status === "pending") return db.payment.findUnique({ where: { id: paymentId } });
  if (status === "succeeded") {
    const { payment, claimed } = await activatePayment(db, paymentId, now);
    if (claimed) await paymentSucceeded(db, payment.id, now);
    return payment;
  }
  const moved = await db.payment.updateMany({
    where: { id: paymentId, status: "pending" },
    data: { status },
  });
  if (moved.count === 1) await paymentFailed(db, paymentId, now);
  return db.payment.findUnique({ where: { id: paymentId } });
}

async function activatePayment(db: PrismaClient, paymentId: string, now: Date) {
  const result = await db.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: "pending" },
      data: { status: "succeeded", paidAt: now },
    });
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (claimed.count === 0) return { payment, claimed: false };
    const subject = { subjectType: payment.subjectType, subjectId: payment.subjectId };
    const others = await tx.subscription.findMany({
      where: { ...subject, source: { not: "license" }, status: { not: "expired" } },
    });
    const same = others.find(
      (row) =>
        row.planId === payment.planId &&
        row.status !== "trialing" &&
        row.currentPeriodEnd >= payment.periodStart,
    );
    let subscriptionId: string;
    if (same) {
      const updated = await tx.subscription.update({
        where: { id: same.id },
        data: {
          status: "active",
          currentPeriodEnd: payment.periodEnd,
          cancelAtPeriodEnd: false,
          pendingPlanId: null,
        },
      });
      subscriptionId = updated.id;
    } else {
      if (payment.periodStart <= now) {
        // Upgrade or first purchase: the new plan replaces the previous one right away.
        await tx.subscription.updateMany({
          where: { id: { in: others.map((row) => row.id) } },
          data: { status: "expired", currentPeriodEnd: now },
        });
      }
      // A renewal into the scheduled cheaper plan starts when the current period ends.
      const created = await tx.subscription.create({
        data: {
          ...subject,
          planId: payment.planId,
          status: "active",
          currentPeriodStart: payment.periodStart,
          currentPeriodEnd: payment.periodEnd,
        },
      });
      subscriptionId = created.id;
    }
    const updated = await tx.payment.update({ where: { id: paymentId }, data: { subscriptionId } });
    return { payment: updated, claimed: true };
  });
  invalidate({ type: result.payment.subjectType, id: result.payment.subjectId });
  return result;
}

/** Trial of a paid plan (before online payment exists, textes `signup.payment.trial`). */
export async function startTrial(
  db: PrismaClient,
  subject: Subject,
  planCode: string,
  now = new Date(),
) {
  const plan = await purchasablePlan(db, subject, planCode);
  if (!plan) return null;
  if (await liveSubscription(db, subject, now)) return null;
  const subscription = await db.subscription.create({
    data: {
      subjectType: subject.type,
      subjectId: subject.id,
      planId: plan.id,
      status: "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + TRIAL_DAYS * 86_400_000),
    },
    include: { plan: true },
  });
  invalidate(subject);
  return subscription;
}

/** Cancel at the end of the paid period, or undo that cancellation. */
export async function setCancelAtPeriodEnd(
  db: PrismaClient,
  subject: Subject,
  cancel: boolean,
  now = new Date(),
) {
  const current = await liveSubscription(db, subject, now);
  if (!current || current.status === "trialing") return null;
  const updated = await db.subscription.update({
    where: { id: current.id },
    data: {
      cancelAtPeriodEnd: cancel,
      status: cancel ? "canceled" : "active",
      pendingPlanId: null,
    },
    include: { plan: true },
  });
  invalidate(subject);
  return updated;
}

/** A cheaper plan takes over at the next renewal (partie 05 § 6: downgrade at period end). */
export async function scheduleDowngrade(
  db: PrismaClient,
  subject: Subject,
  planCode: string | null,
  now = new Date(),
) {
  const current = await liveSubscription(db, subject, now);
  if (!current) return null;
  const plan = planCode ? await purchasablePlan(db, subject, planCode) : null;
  if (planCode && (!plan || (plan.priceCents ?? 0) >= (current.plan.priceCents ?? 0))) return null;
  return db.subscription.update({
    where: { id: current.id },
    data: { pendingPlanId: plan?.id ?? null },
    include: { plan: true, pendingPlan: true },
  });
}

export async function paymentHistory(db: PrismaClient, subject: Subject) {
  return db.payment.findMany({
    where: { subjectType: subject.type, subjectId: subject.id },
    include: { plan: { select: { name: true } }, invoice: { select: { id: true, number: true } } },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
}

export { resolvePlan };
export type { SubjectType };
