/**
 * What follows a change of a payment or a subscription (partie 09 § 9.2): invoice, e-mails,
 * notifications, and the organization's paused offers and members. Each function is called once
 * per change by the code that claimed it (a pending payment moved, a JobRun key written).
 */
import type { PrismaClient, SubjectType } from "@/generated/prisma/client";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { sendPaymentReceipt } from "@/server/account-emails";
import { sendDowngraded, sendPaymentFailed } from "@/server/billing-emails";
import { freePlan, invalidate, limit, parseLimit, type Subject } from "@/server/entitlements";
import { activeJobCount } from "./hire";
import { issueInvoice } from "./invoices";
import { notify } from "./notifications";
import { reportError } from "@/server/observability";

export type Recipient = { id: string; email: string; firstName: string | null };

/** Who hears about the billing of a subject: the user, or the organization's active owners. */
export async function billingRecipients(
  db: PrismaClient,
  subjectType: SubjectType,
  subjectId: string,
): Promise<Recipient[]> {
  const select = { id: true, email: true, firstName: true };
  if (subjectType === "user") {
    const user = await db.user.findUnique({ where: { id: subjectId }, select });
    return user ? [user] : [];
  }
  const owners = await db.membership.findMany({
    where: { organizationId: subjectId, role: "org_owner", status: "active" },
    select: { user: { select } },
  });
  return owners.map((row) => row.user);
}

const methodText = { card: "Carte", mobile_money: "Mobile Money" } as const;

export async function paymentSucceeded(db: PrismaClient, paymentId: string, now = new Date()) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { plan: true },
  });
  if (!payment) return;
  const invoice = await issueInvoice(db, payment.id, now);
  if (payment.subjectType === "organization") await restoreBillingPauses(db, payment.subjectId);
  const recipients = await billingRecipients(db, payment.subjectType, payment.subjectId);
  const plan = payment.plan.name;
  await notify(db, {
    userIds: recipients.map((user) => user.id),
    type:
      payment.kind === "upgrade"
        ? "upgraded"
        : payment.kind === "renewal"
          ? "renewed"
          : "paymentSucceeded",
    payload: { plan, amount: formatUsd(payment.amountCents), date: formatDate(payment.periodEnd) },
    href: "/app/abonnement",
  });
  for (const user of recipients) {
    await sendPaymentReceipt(user.email, {
      firstName: user.firstName,
      plan,
      amount: formatUsd(payment.amountCents),
      method: methodText[payment.method],
      startDate: payment.periodStart,
      endDate: payment.periodEnd,
      invoiceId: invoice?.id,
    }).catch((error) => reportError(error, { message: "Reçu non envoyé" }));
  }
}

export async function paymentFailed(db: PrismaClient, paymentId: string, now = new Date()) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { plan: true },
  });
  if (!payment) return;
  const current = await db.subscription.findFirst({
    where: {
      subjectType: payment.subjectType,
      subjectId: payment.subjectId,
      status: { in: ["active", "past_due", "canceled"] },
      currentPeriodEnd: { gt: now },
    },
    orderBy: { currentPeriodEnd: "desc" },
  });
  const recipients = await billingRecipients(db, payment.subjectType, payment.subjectId);
  await notify(db, {
    userIds: recipients.map((user) => user.id),
    type: "paymentFailed",
    payload: { plan: payment.plan.name },
    href: "/app/abonnement",
  });
  for (const user of recipients) {
    await sendPaymentFailed(user, {
      plan: payment.plan.name,
      amount: formatUsd(payment.amountCents),
      activeUntil: current?.currentPeriodEnd ?? null,
    }).catch((error) => reportError(error, { message: "E-mail d'échec non envoyé" }));
  }
}

/**
 * Back to the free plan (end of grace, trial or cancellation): nothing is deleted. For an
 * organization, the offers beyond the free plan's `jobs.active.max` go back to draft (the oldest
 * published first) and the members beyond `org.seats` are suspended (owners kept first).
 */
export async function returnedToFree(
  db: PrismaClient,
  subject: Subject,
  planName: string,
  now = new Date(),
) {
  invalidate(subject);
  const free = await freePlan(db, subject);
  const freeName = free?.name ?? "";
  if (subject.type === "organization" && free) {
    const value = (key: string) =>
      parseLimit(free.entitlements.find((item) => item.key === key)?.value);
    await pauseBeyondLimits(db, subject.id, value("jobs.active.max"), value("org.seats"), now);
  }
  const recipients = await billingRecipients(db, subject.type, subject.id);
  await notify(db, {
    userIds: recipients.map((user) => user.id),
    type: "downgraded",
    payload: { plan: planName, freePlan: freeName },
    href: "/app/abonnement",
  });
  for (const user of recipients) {
    await sendDowngraded(user, {
      plan: planName,
      freePlan: freeName,
      organization: subject.type === "organization",
    }).catch((error) => reportError(error, { message: "E-mail de retour au gratuit non envoyé" }));
  }
}

async function pauseBeyondLimits(
  db: PrismaClient,
  organizationId: string,
  maxJobs: number,
  maxSeats: number,
  now: Date,
) {
  if (maxJobs >= 0) {
    const active = await db.job.findMany({
      where: { organizationId, status: { in: ["published", "pending_review"] } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });
    const extra = active.slice(maxJobs).map((job) => job.id);
    if (extra.length > 0) {
      await db.job.updateMany({
        where: { id: { in: extra } },
        data: { status: "draft", pausedByBillingAt: now },
      });
    }
  }
  if (maxSeats >= 0) {
    const members = await db.membership.findMany({
      where: { organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true },
    });
    const ordered = [
      ...members.filter((row) => row.role === "org_owner"),
      ...members.filter((row) => row.role !== "org_owner"),
    ];
    const extra = ordered
      .slice(Math.max(maxSeats, members.some((row) => row.role === "org_owner") ? 1 : 0))
      .filter((row) => row.role !== "org_owner")
      .map((row) => row.id);
    if (extra.length > 0) {
      await db.membership.updateMany({
        where: { id: { in: extra } },
        data: { status: "suspended" },
      });
    }
  }
}

/** A paid plan again: paused offers and suspended members come back, within the new limits. */
export async function restoreBillingPauses(db: PrismaClient, organizationId: string) {
  const subject = { type: "organization" as const, id: organizationId };
  invalidate(subject);
  const [maxSeats, maxJobs] = await Promise.all([
    limit(db, subject, "org.seats"),
    limit(db, subject, "jobs.active.max"),
  ]);
  const suspended = await db.membership.findMany({
    where: { organizationId, status: "suspended" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (suspended.length > 0) {
    const members = await db.membership.count({ where: { organizationId, status: "active" } });
    const room = maxSeats < 0 ? suspended.length : Math.max(0, maxSeats - members);
    await db.membership.updateMany({
      where: { id: { in: suspended.slice(0, room).map((row) => row.id) } },
      data: { status: "active" },
    });
  }
  const paused = await db.job.findMany({
    where: { organizationId, status: "draft", pausedByBillingAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, closesAt: true },
  });
  if (paused.length > 0) {
    const active = await activeJobCount(db, organizationId);
    const room = maxJobs < 0 ? paused.length : Math.max(0, maxJobs - active);
    const now = new Date();
    const back = paused.slice(0, room).filter((job) => !job.closesAt || job.closesAt > now);
    await db.job.updateMany({
      where: { id: { in: back.map((job) => job.id) } },
      data: { status: "published", pausedByBillingAt: null },
    });
  }
}
