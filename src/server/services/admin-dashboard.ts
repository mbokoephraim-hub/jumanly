/**
 * `/admin` · Indicateurs (partie 07, mockup 07-01): the platform's health over a period, compared
 * with the period before, the monthly activity, the lists to handle, and the split by family and
 * by plan. Every figure comes from the database; what is not measured yet stays null.
 */
import type { PlanFamily, PrismaClient } from "@/generated/prisma/client";
import { usageReport } from "./ai-admin";
import { revenueIndicators } from "./billing-admin";

const DAY_MS = 86_400_000;
export const DASHBOARD_PERIODS = [7, 30, 90] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/** A payment still « pending » after this delay is checked by hand (partie 09). */
const PENDING_PAYMENT_MS = 15 * 60_000;

/** Statuses that count as « having this plan now ». */
const LIVE = ["active", "trialing", "past_due", "canceled", "sponsored"] as const;

async function liveSubscriptions(db: PrismaClient, at: Date) {
  return db.subscription.findMany({
    where: {
      status: { in: [...LIVE] },
      currentPeriodStart: { lte: at },
      currentPeriodEnd: { gt: at },
      createdAt: { lte: at },
    },
    select: {
      subjectType: true,
      subjectId: true,
      status: true,
      plan: { select: { code: true, name: true, family: true, priceCents: true, sortOrder: true } },
    },
  });
}

/** Accounts and recurring revenue at a given moment. */
async function snapshot(db: PrismaClient, at: Date) {
  const [users, subscriptions, companies] = await Promise.all([
    db.user.count({ where: { createdAt: { lte: at } } }),
    liveSubscriptions(db, at),
    db.organization.count({ where: { type: "company", createdAt: { lte: at } } }),
  ]);
  const personal = subscriptions.filter((row) => row.subjectType === "user");
  const sponsored = new Set(
    personal.filter((row) => row.status === "sponsored").map((row) => row.subjectId),
  );
  const paid = new Set(
    personal
      .filter((row) => row.status !== "sponsored" && (row.plan.priceCents ?? 0) > 0)
      .map((row) => row.subjectId),
  );
  const mrr = subscriptions
    .filter((row) => row.status !== "sponsored")
    .reduce((sum, row) => sum + (row.plan.priceCents ?? 0), 0);
  return {
    usersFree: Math.max(0, users - paid.size - sponsored.size),
    usersPaid: paid.size,
    usersSponsored: sponsored.size,
    mrrCents: mrr,
    activeCompanies: companies,
    subscriptions,
  };
}

/** First day (UTC) of the month `back` months before `now`. */
function monthStart(now: Date, back: number) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
}

/** Monthly counts of the four activity series, over the last `months` months. */
async function activity(db: PrismaClient, now: Date, months = 8) {
  const starts = Array.from({ length: months + 1 }, (_, index) =>
    monthStart(now, months - 1 - index),
  );
  const from = starts[0];
  const [signups, applications, jobs, certificates] = await Promise.all([
    db.user.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
    db.application.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
    db.job.findMany({ where: { publishedAt: { gte: from } }, select: { publishedAt: true } }),
    db.certificate.findMany({ where: { issuedAt: { gte: from } }, select: { issuedAt: true } }),
  ]);
  const bucket = (dates: (Date | null)[]) =>
    starts
      .slice(0, -1)
      .map(
        (start, index) =>
          dates.filter((date) => date && date >= start && date < starts[index + 1]).length,
      );
  return {
    months: starts.slice(0, -1),
    signups: bucket(signups.map((row) => row.createdAt)),
    applications: bucket(applications.map((row) => row.createdAt)),
    jobs: bucket(jobs.map((row) => row.publishedAt)),
    certificates: bucket(certificates.map((row) => row.issuedAt)),
  };
}

/** What waits for someone in the admin: each line leads to the filtered page. */
async function toHandle(db: PrismaClient, now: Date) {
  const [verifications, jobs, reports, disputes, payments] = await Promise.all([
    db.organization.count({ where: { verificationStatus: "pending" } }),
    db.job.count({ where: { status: "pending_review" } }),
    db.report.count({ where: { status: "open" } }),
    db.matchDispute.count({ where: { status: { in: ["open", "in_review"] } } }),
    db.payment.count({
      where: { status: "pending", createdAt: { lt: new Date(now.getTime() - PENDING_PAYMENT_MS) } },
    }),
  ]);
  return { verifications, jobs, reports, disputes, payments };
}

export type FamilyKey = PlanFamily;

export async function dashboardData(db: PrismaClient, now: Date, days: DashboardPeriod) {
  const before = new Date(now.getTime() - days * DAY_MS);
  const [current, previous, revenue, revenueBefore, series, handle, usage, batches, batchesBefore] =
    await Promise.all([
      snapshot(db, now),
      snapshot(db, before),
      revenueIndicators(db, now, days),
      revenueIndicators(db, before, days),
      activity(db, now),
      toHandle(db, now),
      usageReport(db, now, days),
      db.licenseBatch.aggregate({
        where: { createdAt: { gt: before, lte: now } },
        _sum: { priceCents: true },
      }),
      db.licenseBatch.aggregate({
        where: { createdAt: { gt: new Date(before.getTime() - days * DAY_MS), lte: before } },
        _sum: { priceCents: true },
      }),
    ]);

  // Paid and sponsored accounts per family and per plan (free plans are not listed).
  const families: Record<FamilyKey, number> = { talent: 0, rh: 0, company: 0, partner: 0 };
  const plans = new Map<
    string,
    {
      code: string;
      name: string;
      sortOrder: number;
      family: FamilyKey;
      count: number;
      revenueCents: number;
    }
  >();
  for (const row of current.subscriptions) {
    const paid = (row.plan.priceCents ?? 0) > 0 && row.status !== "sponsored";
    if (!paid && row.status !== "sponsored") continue;
    families[row.plan.family]++;
    const entry = plans.get(row.plan.code) ?? {
      code: row.plan.code,
      name: row.plan.name,
      sortOrder: row.plan.sortOrder,
      family: row.plan.family,
      count: 0,
      revenueCents: 0,
    };
    entry.count++;
    if (paid) entry.revenueCents += row.plan.priceCents ?? 0;
    plans.set(row.plan.code, entry);
  }
  const familyOrder: FamilyKey[] = ["talent", "rh", "company", "partner"];

  return {
    current: { ...current, subscriptions: undefined },
    previous: { ...previous, subscriptions: undefined },
    revenue,
    revenueBefore,
    institutionalCents: batches._sum.priceCents ?? 0,
    institutionalBeforeCents: batchesBefore._sum.priceCents ?? 0,
    activity: series,
    toHandle: handle,
    families,
    plans: [...plans.values()].sort(
      (a, b) =>
        familyOrder.indexOf(a.family) - familyOrder.indexOf(b.family) || a.sortOrder - b.sortOrder,
    ),
    ai: usage,
  };
}
