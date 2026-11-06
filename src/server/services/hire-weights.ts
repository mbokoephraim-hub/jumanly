/**
 * « Poids du score » of an offer (évaluation recruteur, 06/11/2026, decision of 01/11/2026: only
 * with a dedicated entitlement, `hire.matching.weights`, never a plan name). The team says what
 * counts more for this post (the required skills, the languages, the place…). The score stays
 * deterministic (partie 08): each criterion keeps what was found, only its weight changes, and the
 * « Pourquoi ? » shows the new weights. The scores already frozen on the applications are
 * recomputed at once, so the pipeline, the classes and the talent read the same number.
 */
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { can } from "@/server/entitlements";
import { reweighted } from "@/server/matching/score";
import { activeWeights, parseExplanation, weightsForJob } from "@/server/matching/service";
import { criterionKeys, type CriterionKey } from "@/server/matching/types";
import { getOrgJob, HireError, hirePermissions, type HireContext } from "./hire";

export const WEIGHTS_ENTITLEMENT = "hire.matching.weights";

/** The weights the offer uses now, and whether they are its own. */
export async function jobWeights(db: PrismaClient, ctx: HireContext, jobId: string) {
  const job = await getOrgJob(db, ctx, jobId);
  const row = await db.job.findUnique({
    where: { id: job.id },
    select: { id: true, title: true, matchingWeights: true },
  });
  const active = await activeWeights(db);
  const weights = weightsForJob(active, row!.matchingWeights);
  return {
    job: { id: row!.id, title: row!.title },
    values: weights.values,
    defaults: active.values,
    own: weights.version !== active.version,
    allowed: await can(db, { type: "organization", id: ctx.organizationId }, WEIGHTS_ENTITLEMENT),
  };
}

/**
 * Saves the weights of the offer (null = back to the weights of partie 08) and recomputes the
 * frozen scores of its applications. Journalised: who changed the weights, and to what.
 */
export async function saveJobWeights(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  values: Record<CriterionKey, number> | null,
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  if (!(await can(db, { type: "organization", id: ctx.organizationId }, WEIGHTS_ENTITLEMENT)))
    throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  if (values && criterionKeys.every((key) => (values[key] ?? 0) === 0))
    throw new HireError("invalid");
  const stored = values
    ? (Object.fromEntries(criterionKeys.map((key) => [key, values[key] ?? 0])) as Record<
        CriterionKey,
        number
      >)
    : null;
  await db.job.update({
    where: { id: job.id },
    data: { matchingWeights: stored ?? Prisma.DbNull },
  });
  const weights = weightsForJob(await activeWeights(db), stored);
  const applications = await db.application.findMany({
    where: { jobId: job.id, NOT: { matchExplanation: { equals: Prisma.DbNull } } },
    select: { id: true, matchExplanation: true },
  });
  for (const application of applications) {
    const explanation = parseExplanation(application.matchExplanation);
    if (!explanation) continue;
    const next = reweighted(explanation, weights);
    await db.application.update({
      where: { id: application.id },
      data: {
        matchScore: next.score,
        matchExplanation: next as unknown as Prisma.InputJsonValue,
      },
    });
  }
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "hire.weights.update",
      targetType: "job",
      targetId: job.id,
      organizationId: ctx.organizationId,
      metadata: { weights: stored, applications: applications.length },
    },
  });
  return { recomputed: applications.length };
}
