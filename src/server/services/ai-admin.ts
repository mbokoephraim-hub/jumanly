/**
 * `/admin/ia` (partie 07, partie 08 § 8.10): AI consumption and estimated cost, distribution of the
 * scores, versions of the matching weights and the human reviews asked by talents.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { hasPrice } from "@/server/ai/prices";
import { criterionKeys } from "@/server/matching/types";
import { weightsSchema } from "@/server/matching/service";

export const USAGE_PERIOD_DAYS = 30;

type UsageRow = {
  key: string;
  calls: number;
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
      feature: true,
      planCode: true,
      model: true,
      status: true,
      inputTokens: true,
      outputTokens: true,
      costMicroUsd: true,
    },
  });
  const group = (keyOf: (row: (typeof rows)[number]) => string) => {
    const map = new Map<string, UsageRow>();
    for (const row of rows) {
      const key = keyOf(row);
      const entry = map.get(key) ?? {
        key,
        calls: 0,
        failures: 0,
        inputTokens: 0,
        outputTokens: 0,
        costMicroUsd: 0,
      };
      entry.calls++;
      if (row.status !== "ok") entry.failures++;
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
    unpriced,
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
