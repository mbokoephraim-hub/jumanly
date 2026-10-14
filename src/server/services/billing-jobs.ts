/**
 * Billing tasks (partie 03 § 3.5, partie 09 § 9.2), run every hour or so by
 * `POST /api/jobs/billing` or `pnpm jobs:billing`: payments without answer, reminders J-7, J-3
 * and J-0, grace period, return to the free plan. Each action is written once in JobRun, so a
 * task run twice (or by two servers at once) never sends anything twice.
 */
import { Prisma, type PrismaClient, type Subscription } from "@/generated/prisma/client";
import { formatDate } from "@/lib/dates";
import { sendGrace, sendRenewalReminder } from "@/server/billing-emails";
import { freePlan, invalidate, type Subject } from "@/server/entitlements";
import { GRACE_DAYS } from "@/server/entitlements/periods";
import type { PaymentProvider } from "@/server/payments";
import { billingRecipients, returnedToFree } from "./billing-events";
import { notify } from "./notifications";
import { endingLicenses, expireLicenses } from "./partners";
import { applyPaymentStatus, PAYMENT_EXPIRY_MS, refreshPayment } from "./subscriptions";
import { reportError } from "@/server/observability";

const DAY_MS = 86_400_000;

/** Runs `action` only if `key` was never run; true when it ran. */
export async function once(db: PrismaClient, key: string, action: () => Promise<unknown>) {
  try {
    await db.jobRun.create({ data: { key } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
  await action();
  return true;
}

export type ReminderStep = "j7" | "j3" | "j0";

/** Which reminder is due `msLeft` before the end of a paid period, if any. */
export function reminderStep(msLeft: number): ReminderStep | null {
  if (msLeft <= 0 || msLeft > 7 * DAY_MS) return null;
  if (msLeft <= DAY_MS) return "j0";
  if (msLeft <= 3 * DAY_MS) return "j3";
  return "j7";
}

const subjectOf = (row: Subscription): Subject => ({ type: row.subjectType, id: row.subjectId });

/** A later subscription that takes over when this one ends (renewal into another plan). */
async function successor(db: PrismaClient, row: Subscription) {
  return db.subscription.findFirst({
    where: {
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      id: { not: row.id },
      status: { in: ["active", "canceled", "sponsored"] },
      currentPeriodEnd: { gt: row.currentPeriodEnd },
    },
  });
}

export type BillingJobsReport = {
  expiredPayments: number;
  reminders: number;
  graces: number;
  returnedToFree: number;
  licenseReminders: number;
  licensesExpired: number;
};

export async function runBillingJobs(
  db: PrismaClient,
  provider: PaymentProvider | null,
  now = new Date(),
  /** Limits the run to these subjects (tests run with a moved clock on a shared database). */
  only?: string[],
): Promise<BillingJobsReport> {
  const scope = only ? { subjectId: { in: only } } : {};
  const report: BillingJobsReport = {
    expiredPayments: 0,
    reminders: 0,
    graces: 0,
    returnedToFree: 0,
    licenseReminders: 0,
    licensesExpired: 0,
  };

  // 1. Mobile Money requests without answer: ask the provider, expire after 15 minutes.
  const stale = await db.payment.findMany({
    where: {
      ...scope,
      status: "pending",
      createdAt: { lt: new Date(now.getTime() - PAYMENT_EXPIRY_MS) },
    },
    select: { id: true, provider: true },
  });
  for (const payment of stale) {
    const updated =
      provider && provider.id === payment.provider
        ? await refreshPayment(db, provider, payment.id, now)
        : await applyPaymentStatus(db, payment.id, "expired", now);
    if (updated?.status === "expired") report.expiredPayments++;
  }

  const paid = {
    ...scope,
    source: { not: "license" as const },
    plan: { priceCents: { gt: 0 } },
  };

  // 2. Reminders before the end of a paid period (not for a cancellation the user asked for).
  const ending = await db.subscription.findMany({
    where: {
      ...paid,
      status: "active",
      currentPeriodStart: { lte: now },
      currentPeriodEnd: { gt: now, lte: new Date(now.getTime() + 7 * DAY_MS) },
    },
    include: { plan: true },
  });
  for (const row of ending) {
    const step = reminderStep(row.currentPeriodEnd.getTime() - now.getTime());
    if (!step || (await successor(db, row))) continue;
    const key = `renewal:${row.id}:${row.currentPeriodEnd.toISOString()}:${step}`;
    const sent = await once(db, key, async () => {
      const recipients = await billingRecipients(db, row.subjectType, row.subjectId);
      const free = await freePlan(db, subjectOf(row));
      await notify(db, {
        userIds: recipients.map((user) => user.id),
        type: "renewalDue",
        payload: { plan: row.plan.name, date: formatDate(row.currentPeriodEnd) },
        href: "/app/abonnement",
      });
      for (const user of recipients) {
        await sendRenewalReminder(user, step, {
          plan: row.plan.name,
          date: row.currentPeriodEnd,
          freePlan: free?.name ?? "",
        }).catch((error) => reportError(error, { message: "Rappel non envoyé" }));
      }
    });
    if (sent) report.reminders++;
  }

  // 3. Unpaid at the end of the period: grace (access kept), once per period.
  const unpaid = await db.subscription.findMany({
    where: {
      ...paid,
      status: "active",
      currentPeriodEnd: { lte: now, gt: new Date(now.getTime() - GRACE_DAYS * DAY_MS) },
    },
    include: { plan: true },
  });
  for (const row of unpaid) {
    if (await successor(db, row)) {
      // Renewed into another plan: this period simply ends.
      await db.subscription.update({ where: { id: row.id }, data: { status: "expired" } });
      invalidate(subjectOf(row));
      continue;
    }
    const graceEnd = new Date(row.currentPeriodEnd.getTime() + GRACE_DAYS * DAY_MS);
    const started = await once(
      db,
      `grace:${row.id}:${row.currentPeriodEnd.toISOString()}`,
      async () => {
        await db.subscription.update({ where: { id: row.id }, data: { status: "past_due" } });
        invalidate(subjectOf(row));
        const recipients = await billingRecipients(db, row.subjectType, row.subjectId);
        const free = await freePlan(db, subjectOf(row));
        await notify(db, {
          userIds: recipients.map((user) => user.id),
          type: "grace",
          payload: { plan: row.plan.name, date: formatDate(graceEnd) },
          href: "/app/abonnement",
        });
        for (const user of recipients) {
          await sendGrace(user, {
            plan: row.plan.name,
            graceEnd,
            freePlan: free?.name ?? "",
          }).catch((error) =>
            reportError(error, { message: "E-mail de délai de grâce non envoyé" }),
          );
        }
      },
    );
    if (started) report.graces++;
  }

  // 4. Grace over (or trial, cancellation over): back to the free plan, nothing deleted.
  const over = await db.subscription.findMany({
    where: {
      ...scope,
      source: { not: "license" },
      OR: [
        {
          status: { in: ["active", "past_due"] },
          currentPeriodEnd: { lte: new Date(now.getTime() - GRACE_DAYS * DAY_MS) },
        },
        { status: { in: ["trialing", "canceled"] }, currentPeriodEnd: { lte: now } },
      ],
    },
    include: { plan: true },
  });
  for (const row of over) {
    await db.subscription.update({ where: { id: row.id }, data: { status: "expired" } });
    const subject = subjectOf(row);
    invalidate(subject);
    if (await successor(db, row)) continue;
    const stillPaid = await db.subscription.findFirst({
      where: {
        subjectType: row.subjectType,
        subjectId: row.subjectId,
        status: { in: ["active", "trialing", "past_due", "canceled", "sponsored"] },
        currentPeriodStart: { lte: now },
        currentPeriodEnd: { gt: now },
      },
    });
    if (stillPaid) continue;
    const done = await once(db, `free:${row.id}:${row.currentPeriodEnd.toISOString()}`, () =>
      returnedToFree(db, subject, row.plan.name, now),
    );
    if (done) report.returnedToFree++;
  }

  // 5. Sponsored licences (Partners): a notice 7 days before the end, then back to the plan
  // below (another subscription, or the free plan), nothing deleted.
  for (const row of await endingLicenses(db, now, only)) {
    const sent = await once(db, `licenseEnding:${row.subscriptionId}`, () =>
      notify(db, {
        userIds: [row.userId],
        type: "licenseExpiring",
        payload: {
          plan: row.planName,
          sponsorName: row.sponsorName,
          date: formatDate(row.endDate),
        },
        href: "/app/abonnement",
      }),
    );
    if (sent) report.licenseReminders++;
  }
  for (const row of await expireLicenses(db, now, only)) {
    const done = await once(db, `licenseExpired:${row.licenseId}`, async () => {
      const free = await freePlan(db, { type: "user", id: row.userId });
      await notify(db, {
        userIds: [row.userId],
        type: "licenseExpired",
        payload: { sponsorName: row.sponsorName, freePlan: free?.name ?? "" },
        href: "/app/abonnement",
      });
    });
    if (done) report.licensesExpired++;
  }
  return report;
}
