/**
 * `/admin/ia` (partie 07, partie 08 § 8.10): AI consumption and estimated cost, distribution of the
 * scores, versions of the matching weights and the human reviews asked by talents.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { AI_CREDITS_KEY, aiFeatures } from "@/server/ai";
import { hasPrice } from "@/server/ai/prices";
import { limit } from "@/server/entitlements";
import { criterionKeys } from "@/server/matching/types";
import { weightsSchema } from "@/server/matching/service";

export const USAGE_PERIOD_DAYS = 30;

type UsageRow = {
  key: string;
  calls: number;
  /** Credits spent by the successful calls (`aiFeatures[feature].credits`). */
  credits: number;
  /** Distinct people who called the AI. */
  people: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
};

/** Calls, failures, tokens and cost per feature and per plan over the last 30 days. */
export async function usageReport(db: PrismaClient, now = new Date(), days = USAGE_PERIOD_DAYS) {
  const since = new Date(now.getTime() - days * 86_400_000);
  const rows = await db.aiUsage.findMany({
    where: { createdAt: { gte: since } },
    select: {
      userId: true,
      feature: true,
      planCode: true,
      model: true,
      status: true,
      inputTokens: true,
      outputTokens: true,
      costMicroUsd: true,
    },
  });
  const creditsOf = (feature: string): number =>
    feature in aiFeatures ? aiFeatures[feature as keyof typeof aiFeatures].credits : 0;
  const group = (keyOf: (row: (typeof rows)[number]) => string) => {
    const map = new Map<string, UsageRow>();
    const people = new Map<string, Set<string>>();
    for (const row of rows) {
      const key = keyOf(row);
      const entry = map.get(key) ?? {
        key,
        calls: 0,
        credits: 0,
        people: 0,
        failures: 0,
        inputTokens: 0,
        outputTokens: 0,
        costMicroUsd: 0,
      };
      entry.calls++;
      if (row.status !== "ok") entry.failures++;
      else entry.credits += creditsOf(row.feature);
      const set = people.get(key) ?? new Set<string>();
      if (row.userId) set.add(row.userId);
      people.set(key, set);
      entry.people = set.size;
      entry.inputTokens += row.inputTokens;
      entry.outputTokens += row.outputTokens;
      entry.costMicroUsd += row.costMicroUsd;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.calls - a.calls);
  };
  const unpriced = [
    ...new Set(rows.filter((row) => !hasPrice(row.model)).map((row) => row.model)),
  ].sort();
  return {
    byFeature: group((row) => row.feature),
    byPlan: group((row) => row.planCode ?? ""),
    total: rows.reduce((sum, row) => sum + row.costMicroUsd, 0),
    credits: rows.reduce((sum, row) => sum + (row.status === "ok" ? creditsOf(row.feature) : 0), 0),
    unpriced,
  };
}

/** The AI cost of a plan above this share of its monthly price raises an alert (Admin v2, étape 8). */
export const PLAN_COST_ALERT = 0.3;

/**
 * Cost of the AI per person and per plan over the period, against the monthly price of the plan:
 * a share at or above 30 % is an alert. Free plans and plans on quote have no share.
 */
export function planCosts(
  byPlan: UsageRow[],
  plans: { code: string; name: string; priceCents: number | null; interval: string }[],
) {
  return byPlan.map((row) => {
    const plan = plans.find((item) => item.code === row.key);
    const monthlyCents =
      plan?.priceCents == null
        ? null
        : plan.interval === "year"
          ? Math.round(plan.priceCents / 12)
          : plan.priceCents;
    const perPerson = row.people ? row.costMicroUsd / row.people : 0;
    // Micro-USD against cents: 1 cent = 10 000 micro-USD.
    const share = monthlyCents ? perPerson / (monthlyCents * 10_000) : null;
    return {
      key: row.key,
      name: plan?.name ?? null,
      people: row.people,
      perPersonMicroUsd: Math.round(perPerson),
      monthlyCents,
      share,
      alert: share !== null && share >= PLAN_COST_ALERT,
    };
  });
}

/**
 * The monthly AI budget of `AI_MONTHLY_BUDGET_USD` (optional): the cost of the current month
 * against it, a warning from 80 %, an error above 100 %.
 */
export async function monthBudget(db: PrismaClient, now = new Date()) {
  const raw = Number(process.env.AI_MONTHLY_BUDGET_USD ?? "");
  const budgetMicroUsd = Number.isFinite(raw) && raw > 0 ? Math.round(raw * 1_000_000) : null;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const spent = await db.aiUsage.aggregate({
    where: { createdAt: { gte: start } },
    _sum: { costMicroUsd: true },
  });
  const spentMicroUsd = spent._sum.costMicroUsd ?? 0;
  const share = budgetMicroUsd ? spentMicroUsd / budgetMicroUsd : null;
  return {
    budgetMicroUsd,
    spentMicroUsd,
    share,
    level: share === null ? null : share > 1 ? "over" : share >= 0.8 ? "near" : "ok",
  } as const;
}

/** People and organizations who used all their AI credits of the current period. */
export async function exhaustedCredits(db: PrismaClient, now = new Date()) {
  const counters = await db.usageCounter.findMany({
    where: {
      key: AI_CREDITS_KEY,
      periodStart: { lte: now },
      periodEnd: { gt: now },
      used: { gt: 0 },
    },
    select: { subjectType: true, subjectId: true, used: true },
    take: 5000,
  });
  let count = 0;
  for (const counter of counters) {
    const max = await limit(
      db,
      { type: counter.subjectType, id: counter.subjectId },
      AI_CREDITS_KEY,
    );
    if (max >= 0 && counter.used >= max) count++;
  }
  return count;
}

/** Models in use: the variables `AI_MODEL_DEFAULT` and `AI_MODEL_FAST`, read only. */
export function configuredModels() {
  return {
    default: process.env.AI_MODEL_DEFAULT || null,
    fast: process.env.AI_MODEL_FAST || null,
  };
}

/** Number of cached scores per band (veryHigh, high, partial, low). */
export async function scoreDistribution(db: PrismaClient) {
  const rows = await db.matchResult.groupBy({ by: ["band"], _count: { _all: true } });
  const count = (band: string) => rows.find((row) => row.band === band)?._count._all ?? 0;
  return (["veryHigh", "high", "partial", "low"] as const).map((band) => ({
    band,
    count: count(band),
  }));
}

export async function weightsHistory(db: PrismaClient) {
  return db.matchingWeights.findMany({ orderBy: { activeFrom: "desc" }, take: 10 });
}

export const weightsInputSchema = weightsSchema
  .extend({ note: z.string().trim().max(300) })
  .refine((input) => criterionKeys.reduce((sum, key) => sum + input[key], 0) === 100);

/**
 * A new version of the weights, active at once. Cached scores carry their version, so each one is
 * recomputed the next time it is read (§ 8.10); the applications keep the score they were sent with.
 */
export async function saveWeights(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof weightsInputSchema>,
  now = new Date(),
) {
  const values = Object.fromEntries(criterionKeys.map((key) => [key, input[key]]));
  const version = `${now.toISOString().slice(0, 10)}-${now.getTime().toString(36)}`;
  const row = await db.matchingWeights.create({
    data: {
      version,
      weights: values,
      activeFrom: now,
      createdById: actorId,
      note: input.note || null,
    },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: "matching.weights.update",
      targetType: "matchingWeights",
      targetId: row.id,
      metadata: { version, weights: values, reason: input.note },
    },
  });
  return row;
}

/** Reviews still waiting for an answer, oldest first, with the job and the talent's name. */
export async function openDisputes(db: PrismaClient) {
  const disputes = await db.matchDispute.findMany({
    where: { status: { in: ["open", "in_review"] } },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, email: true } } },
    take: 100,
  });
  const jobs = await db.job.findMany({
    where: { id: { in: disputes.map((item) => item.jobId) } },
    select: { id: true, slug: true, title: true, organization: { select: { name: true } } },
  });
  return disputes.map((item) => ({
    ...item,
    job: jobs.find((job) => job.id === item.jobId) ?? null,
  }));
}
