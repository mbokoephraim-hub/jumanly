/**
 * Sorting gestures of the pipeline (« JUMANLY Hire, logique du recrutement », étape 5 « Tri »,
 * Ephraïm 01/11/2026): « Retenir » puts the person in the list of the retained, « En attente »
 * keeps them aside without any answer, and a member can mark an elimination criterion as missing
 * (« Hors critères ») or met again. Every gesture is a member's, recorded in the history, and can be
 * undone. Orbi never makes one. Golden rule n° 6: every write goes through `getOrgApplication`.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { getOrgApplication, getOrgJob, HireError, hirePermissions, type HireContext } from "./hire";
import { allowedFilters, filtersLevelOf, type PipelineFilters } from "./hire-filters";
import { level } from "@/server/entitlements";
import { shortlist, unshortlist } from "./hire-ats";
import {
  CRITERION_MET_EVENT,
  CRITERION_UNMET_EVENT,
  HOLD_EVENT,
  HOLD_LIFTED_EVENT,
  isOnHold,
} from "./hire-classes";
import { parseCriteria } from "./jobs";

export const sortGestures = ["retenir", "attente", "annuler-retenir", "annuler-attente"] as const;
export type SortGesture = (typeof sortGestures)[number];

export { isOnHold };

async function editable(db: PrismaClient, ctx: HireContext, applicationId: string) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const application = await getOrgApplication(db, ctx, applicationId);
  if (application.status !== "active") throw new HireError("invalid");
  return application;
}

/** One sorting gesture on one application. Returns the job, for the way back. */
export async function sortGesture(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  gesture: SortGesture,
  now = new Date(),
) {
  const application = await editable(db, ctx, applicationId);
  const jobId = application.jobId;
  const onHold = isOnHold(application.events);
  if (gesture === "retenir") {
    await shortlist(db, ctx, jobId, [application.id], now);
    if (onHold)
      await db.applicationEvent.create({
        data: { applicationId, actorId: ctx.userId, type: HOLD_LIFTED_EVENT, createdAt: now },
      });
  } else if (gesture === "annuler-retenir") {
    if (application.shortlistedAt) await unshortlist(db, ctx, jobId, application.id, now);
  } else if (gesture === "attente") {
    if (!onHold)
      await db.applicationEvent.create({
        data: { applicationId, actorId: ctx.userId, type: HOLD_EVENT, createdAt: now },
      });
  } else if (onHold) {
    await db.applicationEvent.create({
      data: { applicationId, actorId: ctx.userId, type: HOLD_LIFTED_EVENT, createdAt: now },
    });
  }
  return { jobId };
}

/**
 * « Ne remplit pas ce critère » / « Le remplit » on a summary: only the elimination criteria the
 * offer states; the person moves to « Hors critères » and stays visible.
 */
export async function markCriterion(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  label: string,
  missing: boolean,
  now = new Date(),
) {
  const application = await editable(db, ctx, applicationId);
  if (!parseCriteria(application.job.knockoutCriteria).includes(label))
    throw new HireError("invalid");
  await db.applicationEvent.create({
    data: {
      applicationId,
      actorId: ctx.userId,
      type: missing ? CRITERION_UNMET_EVENT : CRITERION_MET_EVENT,
      payload: { label },
      createdAt: now,
    },
  });
  return { jobId: application.jobId };
}

/** « Enregistrer les filtres » of an offer, and the blind sorting (for the whole team). */
export async function saveFilters(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  filters: PipelineFilters,
  blindSort: boolean,
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const filtersLevel = filtersLevelOf(
    await level(db, { type: "organization", id: ctx.organizationId }, "hire.ats.filters"),
  );
  const kept = allowedFilters(filters, filtersLevel);
  await db.job.update({
    where: { id: job.id },
    data: { pipelineFilters: kept as Prisma.InputJsonObject, blindSort },
  });
}
