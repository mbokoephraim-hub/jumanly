/**
 * Jumanly Admin v2 · indicateurs intelligents (docs/admin-v2/PLAN-ADMIN.md, étape 2): the plans in
 * use (free plans included), the prioritised list of what needs attention, and the indicators
 * derived from the running costs entered by an administrator. Every rule is deterministic.
 */
import { z } from "zod";
import type { PlanFamily, PlatformCostCategory, PrismaClient } from "@/generated/prisma/client";

const DAY_MS = 86_400_000;
const LIVE = ["active", "trialing", "past_due", "canceled", "sponsored"] as const;
export const FAMILIES: PlanFamily[] = ["talent", "rh", "company", "partner"];
export const COST_CATEGORIES: PlatformCostCategory[] = [
  "acquisition",
  "hosting",
  "ai_external",
  "other",
];

// ─── Forfaits utilisés ─────────────────────────────────────────────────────────

export type PlanUsageRow = {
  code: string;
  name: string;
  family: PlanFamily;
  priceCents: number | null;
  /** Accounts on this plan now (paid, sponsored or free). */
  count: number;
  /** Of which sponsored (licences). */
  sponsored: number;
  /** Accounts on this plan at the start of the period. */
  previous: number;
};

/** Plan of each subject at a moment: the live subscription with the highest price, else free. */
async function plansAt(db: PrismaClient, at: Date) {
  const [subscriptions, organizations] = await Promise.all([
    db.subscription.findMany({
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
        plan: { select: { code: true, priceCents: true } },
      },
    }),
    db.organization.groupBy({
      by: ["type"],
      where: { createdAt: { lte: at } },
      _count: { _all: true },
    }),
  ]);
  const best = new Map<string, { code: string; price: number; sponsored: boolean; type: string }>();
  for (const row of subscriptions) {
    const key = `${row.subjectType}:${row.subjectId}`;
    const price = row.plan.priceCents ?? 0;
    const current = best.get(key);
    if (!current || price > current.price) {
      best.set(key, {
        code: row.plan.code,
        price,
        sponsored: row.status === "sponsored",
        type: row.subjectType,
      });
    }
  }
  const counts = new Map<string, { count: number; sponsored: number }>();
  for (const entry of best.values()) {
    const row = counts.get(entry.code) ?? { count: 0, sponsored: 0 };
    row.count++;
    if (entry.sponsored) row.sponsored++;
    counts.set(entry.code, row);
  }
  const subscribedUsers = [...best.values()].filter((entry) => entry.type === "user").length;
  const orgsByType = Object.fromEntries(
    organizations.map((row) => [row.type, row._count._all]),
  ) as Record<string, number>;
  return { counts, subscribedUsers, orgsByType, best };
}

/**
 * Accounts per plan now and at the start of the period. Subjects without a subscription are
 * counted on their family's free plan, as the entitlement engine does (`freeFamily`).
 */
export async function planUsage(db: PrismaClient, now: Date, days: number) {
  const start = new Date(now.getTime() - days * DAY_MS);
  const [plans, current, previous] = await Promise.all([
    db.plan.findMany({
      where: { active: true },
      orderBy: [{ family: "asc" }, { sortOrder: "asc" }],
      select: { code: true, name: true, family: true, priceCents: true, sortOrder: true },
    }),
    plansAt(db, now),
    plansAt(db, start),
  ]);
  const freeCode = (family: PlanFamily) =>
    plans.find((plan) => plan.family === family && plan.priceCents === 0)?.code;

  const withFree = async (snapshot: Awaited<ReturnType<typeof plansAt>>, at: Date) => {
    const counts = new Map(snapshot.counts);
    const add = (code: string | undefined, value: number) => {
      if (!code || value <= 0) return;
      const row = counts.get(code) ?? { count: 0, sponsored: 0 };
      counts.set(code, { ...row, count: row.count + value });
    };
    add(
      freeCode("talent"),
      (await db.user.count({ where: { createdAt: { lte: at } } })) - snapshot.subscribedUsers,
    );
    const subscribedOrgs = { partner: 0, other: 0 };
    if ([...snapshot.best.keys()].some((key) => key.startsWith("organization:"))) {
      const ids = [...snapshot.best.keys()]
        .filter((key) => key.startsWith("organization:"))
        .map((key) => key.slice("organization:".length));
      const orgs = await db.organization.findMany({
        where: { id: { in: ids } },
        select: { type: true },
      });
      for (const org of orgs) subscribedOrgs[org.type === "partner" ? "partner" : "other"]++;
    }
    const orgTotal = (types: string[]) =>
      types.reduce((sum, type) => sum + (snapshot.orgsByType[type] ?? 0), 0);
    add(freeCode("rh"), orgTotal(["recruiter", "company"]) - subscribedOrgs.other);
    add(freeCode("partner"), orgTotal(["partner"]) - subscribedOrgs.partner);
    return counts;
  };

  const [now_, before] = await Promise.all([withFree(current, now), withFree(previous, start)]);
  const rows: PlanUsageRow[] = plans.map((plan) => ({
    code: plan.code,
    name: plan.name,
    family: plan.family,
    priceCents: plan.priceCents,
    count: now_.get(plan.code)?.count ?? 0,
    sponsored: now_.get(plan.code)?.sponsored ?? 0,
    previous: before.get(plan.code)?.count ?? 0,
  }));
  return FAMILIES.map((family) => {
    const familyRows = rows.filter((row) => row.family === family);
    return {
      family,
      total: familyRows.reduce((sum, row) => sum + row.count, 0),
      sponsored: familyRows.reduce((sum, row) => sum + row.sponsored, 0),
      plans: familyRows,
    };
  });
}

/** Where the accounts of a plan are listed: people for Talent, organizations for the others. */
export function planListHref(family: PlanFamily, code: string) {
  return family === "talent"
    ? `/admin/utilisateurs?forfait=${encodeURIComponent(code)}`
    : `/admin/organisations?forfait=${encodeURIComponent(code)}`;
}

// ─── Ce qui demande votre attention ────────────────────────────────────────────

export const ATTENTION_KINDS = [
  "payments",
  "reports",
  "disputes",
  "verifications",
  "jobs",
  "aiSpike",
  "expiring",
] as const;
export type AttentionKind = (typeof ATTENTION_KINDS)[number];

/** Base priority of each kind: money and people first, then decisions, then reminders. */
export const ATTENTION_BASE: Record<AttentionKind, number> = {
  payments: 60,
  reports: 55,
  disputes: 50,
  verifications: 45,
  jobs: 40,
  aiSpike: 35,
  expiring: 20,
};

/** A dispute is answered within 5 business days (partie 08): overdue after 7 calendar days. */
export const DISPUTE_DUE_DAYS = 7;
/** AI spending of the last 24 hours compared with the daily average of the 30 days before. */
export const AI_SPIKE_FACTOR = 3;
export const AI_SPIKE_MIN_MICRO_USD = 1_000_000;

export type AttentionItem = {
  kind: AttentionKind;
  count: number;
  /** Age in days of the oldest item (0 for today). */
  oldestDays: number;
  overdue: boolean;
  score: number;
  href: string;
  /** Values for the « Pourquoi ? » text. */
  why: Record<string, number>;
};

/** Priority of a group of items: its base, plus 2 points per day of waiting (30 days at most). */
export function attentionScore(kind: AttentionKind, oldestDays: number, overdue: boolean) {
  return ATTENTION_BASE[kind] + Math.min(30, Math.max(0, oldestDays)) * 2 + (overdue ? 25 : 0);
}

const daysSince = (date: Date | null | undefined, now: Date) =>
  date ? Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS)) : 0;

const hrefs: Record<AttentionKind, string> = {
  payments: "/admin/abonnements",
  reports: "/admin/signalements",
  disputes: "/admin/ia?onglet=revisions",
  verifications: "/admin/organisations?onglet=attente",
  jobs: "/admin/offres",
  aiSpike: "/admin/ia",
  expiring: "/admin/abonnements?statut=active",
};

/** Everything that waits for someone, the most urgent first. Empty groups are left out. */
export async function attentionItems(db: PrismaClient, now = new Date()) {
  const in7 = new Date(now.getTime() + 7 * DAY_MS);
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const monthAgo = new Date(now.getTime() - 31 * DAY_MS);
  const [payments, reports, disputes, verifications, jobs, expiring, aiDay, aiMonth] =
    await Promise.all([
      db.payment.aggregate({
        where: { status: "pending", createdAt: { lt: new Date(now.getTime() - 15 * 60_000) } },
        _count: { _all: true },
        _min: { createdAt: true },
      }),
      db.report.aggregate({
        where: { status: { in: ["open", "in_progress"] } },
        _count: { _all: true },
        _min: { createdAt: true },
      }),
      db.matchDispute.aggregate({
        where: { status: { in: ["open", "in_review"] } },
        _count: { _all: true },
        _min: { createdAt: true },
      }),
      db.organization.aggregate({
        where: { verificationStatus: "pending" },
        _count: { _all: true },
        _min: { verificationRequestedAt: true },
      }),
      db.job.aggregate({
        where: { status: "pending_review" },
        _count: { _all: true },
        _min: { updatedAt: true },
      }),
      db.subscription.aggregate({
        where: {
          status: { in: ["active", "past_due", "canceled"] },
          currentPeriodEnd: { gte: now, lte: in7 },
        },
        _count: { _all: true },
        _min: { currentPeriodEnd: true },
      }),
      db.aiUsage.aggregate({
        where: { createdAt: { gte: dayAgo } },
        _sum: { costMicroUsd: true },
      }),
      db.aiUsage.aggregate({
        where: { createdAt: { gte: monthAgo, lt: dayAgo } },
        _sum: { costMicroUsd: true },
      }),
    ]);

  const items: AttentionItem[] = [];
  const push = (
    kind: AttentionKind,
    count: number,
    oldest: Date | null | undefined,
    extra: { overdue?: boolean; why?: Record<string, number> } = {},
  ) => {
    if (count <= 0) return;
    const oldestDays = daysSince(oldest, now);
    const overdue = extra.overdue ?? false;
    items.push({
      kind,
      count,
      oldestDays,
      overdue,
      score: attentionScore(kind, oldestDays, overdue),
      href: hrefs[kind],
      why: { count, days: oldestDays, ...extra.why },
    });
  };

  push("payments", payments._count._all, payments._min.createdAt);
  push("reports", reports._count._all, reports._min.createdAt);
  const disputeDays = daysSince(disputes._min.createdAt, now);
  push("disputes", disputes._count._all, disputes._min.createdAt, {
    overdue: disputeDays >= DISPUTE_DUE_DAYS,
    why: { due: DISPUTE_DUE_DAYS },
  });
  push("verifications", verifications._count._all, verifications._min.verificationRequestedAt);
  push("jobs", jobs._count._all, jobs._min.updatedAt);

  const spike = aiSpike(aiDay._sum.costMicroUsd ?? 0, aiMonth._sum.costMicroUsd ?? 0);
  if (spike) push("aiSpike", 1, now, { why: spike });

  // Renewals: the nearest end date counts as « age » (sooner = more urgent).
  if (expiring._count._all > 0) {
    const soonest = expiring._min.currentPeriodEnd!;
    const daysLeft = Math.max(0, Math.ceil((soonest.getTime() - now.getTime()) / DAY_MS));
    items.push({
      kind: "expiring",
      count: expiring._count._all,
      oldestDays: 0,
      overdue: false,
      score: attentionScore("expiring", 7 - daysLeft, false),
      href: hrefs.expiring,
      why: { count: expiring._count._all, days: daysLeft },
    });
  }

  return items.sort((a, b) => b.score - a.score);
}

/**
 * Unusual AI spending: the last 24 hours cost more than three times the daily average of the 30
 * days before, and at least 1 USD (a few cents of difference is not news).
 */
export function aiSpike(lastDayMicroUsd: number, previous30DaysMicroUsd: number) {
  const average = previous30DaysMicroUsd / 30;
  if (lastDayMicroUsd < AI_SPIKE_MIN_MICRO_USD) return null;
  if (average > 0 && lastDayMicroUsd < AI_SPIKE_FACTOR * average) return null;
  return {
    lastDayCents: Math.round(lastDayMicroUsd / 10_000),
    averageCents: Math.round(average / 10_000),
    factor: AI_SPIKE_FACTOR,
  };
}

// ─── Coûts et indicateurs dérivés ──────────────────────────────────────────────

export function monthOf(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** « 2026-10 » → first day of that month (UTC), or null. */
export function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(Number(match[1]), month - 1, 1));
}

export function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** « 12,50 » or « 12.5 » USD → 1250 cents; empty → 0; anything else → null. */
export function parseUsd(value: string) {
  const text = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return 0;
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(text)) return null;
  return Math.round(Number(text) * 100);
}

export const costInputSchema = z.object({
  month: z.string().transform((value, context) => {
    const month = parseMonth(value);
    if (!month) context.addIssue({ code: "custom", message: "month" });
    return month ?? new Date(0);
  }),
  note: z.string().trim().max(500).default(""),
  acquisition: z.string().default(""),
  hosting: z.string().default(""),
  ai_external: z.string().default(""),
  other: z.string().default(""),
});

/** Saves the costs of one month (one row per category; 0 removes it), then audits it. */
export async function saveMonthlyCosts(
  db: PrismaClient,
  actorId: string,
  month: Date,
  amounts: Record<PlatformCostCategory, number>,
  note: string,
) {
  await db.$transaction(
    COST_CATEGORIES.map((category) =>
      amounts[category] > 0
        ? db.platformCost.upsert({
            where: { month_category: { month, category } },
            update: { amountCents: amounts[category], note: note || null, updatedById: actorId },
            create: {
              month,
              category,
              amountCents: amounts[category],
              note: note || null,
              updatedById: actorId,
            },
          })
        : db.platformCost.deleteMany({ where: { month, category } }),
    ),
  );
  await db.auditLog.create({
    data: {
      actorId,
      action: "cost.save",
      targetType: "platform",
      targetId: monthKey(month),
      metadata: { month: monthKey(month), amounts, reason: note },
    },
  });
}

/** Costs of the last `months` months, the newest first, with their total. */
export async function costHistory(db: PrismaClient, now: Date, months = 12) {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const rows = await db.platformCost.findMany({ where: { month: { gte: from } } });
  return Array.from({ length: months }, (_, index) => {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const ofMonth = rows.filter((row) => row.month.getTime() === month.getTime());
    const amounts = Object.fromEntries(
      COST_CATEGORIES.map((category) => [
        category,
        ofMonth.find((row) => row.category === category)?.amountCents ?? 0,
      ]),
    ) as Record<PlatformCostCategory, number>;
    return {
      month,
      key: monthKey(month),
      amounts,
      note: ofMonth.find((row) => row.note)?.note ?? null,
      total: Object.values(amounts).reduce((sum, value) => sum + value, 0),
      entered: ofMonth.length > 0,
    };
  });
}

/**
 * Costs of a period, each monthly amount counted for the share of its month inside the period
 * (a 30-day period over two months takes part of each).
 */
export function prorateCosts(
  rows: { month: Date; category: PlatformCostCategory; amountCents: number }[],
  from: Date,
  to: Date,
) {
  const totals = Object.fromEntries(COST_CATEGORIES.map((key) => [key, 0])) as Record<
    PlatformCostCategory,
    number
  >;
  for (const row of rows) {
    const start = row.month;
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const overlap =
      Math.min(end.getTime(), to.getTime()) - Math.max(start.getTime(), from.getTime());
    if (overlap <= 0) continue;
    totals[row.category] += (row.amountCents * overlap) / (end.getTime() - start.getTime());
  }
  for (const key of COST_CATEGORIES) totals[key] = Math.round(totals[key]);
  return totals;
}

/**
 * Indicators that need the costs: acquisition cost per new paying account, running cost per
 * active account, gross margin. Null while no cost was entered for the period (or when the
 * divisor is zero), so the dashboard keeps saying « Pas encore de données ».
 */
export async function costIndicators(
  db: PrismaClient,
  now: Date,
  days: number,
  revenueCents: number,
  aiCostMicroUsd: number,
) {
  const from = new Date(now.getTime() - days * DAY_MS);
  const [rows, newPaying, activeUsers] = await Promise.all([
    db.platformCost.findMany({ where: { month: { gte: monthOf(from), lte: now } } }),
    newPayingAccounts(db, from, now),
    activeAccounts(db, from, now),
  ]);
  if (rows.length === 0) {
    return {
      entered: false,
      cacCents: null,
      costPerUserCents: null,
      grossMargin: null,
      totalCents: 0,
    };
  }
  const costs = prorateCosts(rows, from, now);
  const aiCents = Math.round(aiCostMicroUsd / 10_000);
  const running = costs.hosting + costs.ai_external + costs.other + aiCents;
  const total = running + costs.acquisition;
  return {
    entered: true,
    totalCents: total,
    cacCents: newPaying > 0 ? Math.round(costs.acquisition / newPaying) : null,
    costPerUserCents: activeUsers > 0 ? Math.round(running / activeUsers) : null,
    grossMargin:
      revenueCents > 0 ? Math.round((1000 * (revenueCents - running)) / revenueCents) / 10 : null,
  };
}

/** Accounts whose first successful payment falls in the period. */
export async function newPayingAccounts(db: PrismaClient, from: Date, to: Date) {
  const first = await db.payment.groupBy({
    by: ["subjectType", "subjectId"],
    where: { status: { in: ["succeeded", "refunded"] } },
    _min: { paidAt: true },
  });
  return first.filter((row) => row._min.paidAt && row._min.paidAt >= from && row._min.paidAt <= to)
    .length;
}

/** People who used Jumanly during the period (a session refreshed in it). */
export async function activeAccounts(db: PrismaClient, from: Date, to: Date) {
  const rows = await db.session.groupBy({
    by: ["userId"],
    where: { updatedAt: { gte: from, lte: to } },
  });
  return rows.length;
}
