/**
 * Subscriptions and payments (docs/specifications.md, parties 05 § 6, 06 § 6.7 and 09).
 * Prepaid periods; the provider's status (webhook or getStatus) is the source of truth, never the
 * browser. Activation is idempotent: a payment activates a plan once.
 */
import { randomUUID } from "node:crypto";
import type { PlanFamily, PrismaClient, SubjectType } from "@/generated/prisma/client";
import { invalidate, resolvePlan, type Subject } from "@/server/entitlements";
import { addMonths, effectiveStatus } from "@/server/entitlements/periods";
import type { PaymentMethodCode, PaymentProvider } from "@/server/payments";

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

/** The live paid subscription of a subject (not a licence), if any. */
export async function liveSubscription(db: PrismaClient, subject: Subject, now = new Date()) {
  const rows = await db.subscription.findMany({
    where: { subjectType: subject.type, subjectId: subject.id, source: { not: "license" } },
    include: { plan: true, pendingPlan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });
  return rows.find((row) => effectiveStatus(row, now) !== "expired") ?? null;
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
    email: string;
    country: string;
    msisdn?: string;
    operator?: string;
    returnUrl: string;
  },
  now = new Date(),
): Promise<CheckoutResult> {
  const plan = await purchasablePlan(db, input.subject, input.planCode);
  if (!plan || !plan.priceCents) return { status: "unavailable" };

  const pending = await db.payment.findFirst({
    where: {
      subjectType: input.subject.type,
      subjectId: input.subject.id,
      status: "pending",
      createdAt: { gt: new Date(now.getTime() - PAYMENT_EXPIRY_MS) },
    },
  });
  if (pending) return { status: "duplicate" };

  // Renewing the same plan extends the paid period; any other plan starts now (upgrade: immediate).
  const current = await liveSubscription(db, input.subject, now);
  const renewing = current?.planId === plan.id && current.currentPeriodEnd > now;
  const periodStart = renewing ? current.currentPeriodEnd : now;
  const periodEnd = addMonths(periodStart, 1);

  const idempotencyKey = randomUUID();
  const created = await provider.createPayment({
    amountCents: plan.priceCents,
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
      planId: plan.id,
      provider: provider.id,
      method: input.method,
      operator: input.operator,
      msisdnMasked: input.msisdn ? maskNumber(input.msisdn) : null,
      amountCents: plan.priceCents,
      providerRef: created.providerRef,
      idempotencyKey,
      periodStart,
      periodEnd,
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
  if (status === "pending") return payment;
  if (status === "succeeded") return activatePayment(db, payment.id, now);
  await db.payment.updateMany({ where: { id: payment.id, status: "pending" }, data: { status } });
  return db.payment.findUnique({ where: { id: payment.id } });
}

async function activatePayment(db: PrismaClient, paymentId: string, now: Date) {
  const result = await db.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: "pending" },
      data: { status: "succeeded", paidAt: now },
    });
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (claimed.count === 0) return payment;
    const subject = { subjectType: payment.subjectType, subjectId: payment.subjectId };
    const others = await tx.subscription.findMany({
      where: { ...subject, source: { not: "license" }, status: { not: "expired" } },
    });
    const same = others.find(
      (row) => row.planId === payment.planId && row.currentPeriodEnd >= payment.periodStart,
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
      // Upgrade or first purchase: the new plan replaces the previous one right away.
      await tx.subscription.updateMany({
        where: { id: { in: others.map((row) => row.id) } },
        data: { status: "expired", currentPeriodEnd: now },
      });
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
    return tx.payment.update({ where: { id: paymentId }, data: { subscriptionId } });
  });
  invalidate({ type: result.subjectType, id: result.subjectId });
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
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
}

export { resolvePlan };
export type { SubjectType };
