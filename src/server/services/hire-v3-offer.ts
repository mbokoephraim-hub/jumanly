/**
 * La fiche d'une offre in the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, screen
 * 08, `V.offre`): the figures of the offer, its views over 30 days, its funnel, Orbi's top 3, its
 * sources and the applications of the last days; the announcement with Orbi's weights; where it
 * was shared. Real figures only (golden rule n° 11), the job read through `getOrgJob` (scoped to
 * the organization, golden rule n° 6).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { activeWeights, parseExplanation, weightsForJob } from "@/server/matching/service";
import { criterionKeys } from "@/server/matching/types";
import { can } from "@/server/entitlements";
import { defaultStages } from "./applications";
import { getOrgJob, hirePermissions, jobScope, type HireContext } from "./hire";
import { WEIGHTS_ENTITLEMENT } from "./hire-weights";
import { HIGH_POTENTIAL } from "./hire-v3-offers";

const DAY = 86_400_000;
const dayStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/** The funnel of the prototype: each step counts those who reached it or went further. */
const FUNNEL_KINDS = [
  ["screening", "test", "interview", "offer", "hired"],
  ["interview", "offer", "hired"],
  ["offer", "hired"],
] as const;

export async function offerV3(db: PrismaClient, ctx: HireContext, jobId: string, now = new Date()) {
  const job = await getOrgJob(db, ctx, jobId);
  const reads = hirePermissions(ctx.role).readApplications;
  const end = new Date(dayStart(now).getTime() + DAY);
  const start = new Date(end.getTime() - 30 * DAY);
  const [department, views, applications, stages, top, active] = await Promise.all([
    job.departmentId
      ? db.team.findUnique({ where: { id: job.departmentId }, select: { name: true } })
      : null,
    db.jobViewDay.findMany({
      where: { jobId: job.id, day: { gte: start, lt: end } },
      select: { day: true, count: true },
    }),
    db.application.findMany({
      where: { jobId: job.id },
      select: { createdAt: true, source: true, matchScore: true, stageId: true },
    }),
    db.pipelineStage.findMany({ where: { jobId: job.id }, select: { id: true, kind: true } }),
    reads
      ? db.application.findMany({
          where: { jobId: job.id, status: "active", matchScore: { not: null } },
          orderBy: { matchScore: "desc" },
          take: 3,
          select: {
            id: true,
            matchScore: true,
            matchExplanation: true,
            profile: { select: { user: { select: { name: true } } } },
          },
        })
      : [],
    activeWeights(db),
  ]);
  const series = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(start.getTime() + index * DAY);
    return {
      day,
      count: views
        .filter((v) => dayStart(v.day).getTime() === day.getTime())
        .reduce((sum, v) => sum + v.count, 0),
    };
  });
  const viewsTotal = series.reduce((sum, d) => sum + d.count, 0);
  const kindOf = new Map(stages.map((stage) => [stage.id, stage.kind]));
  const reached = (kinds: readonly string[]) =>
    applications.filter((a) => kinds.includes(kindOf.get(a.stageId) ?? "")).length;
  const high = applications.filter((a) => (a.matchScore ?? 0) >= HIGH_POTENTIAL).length;
  // « Candidatures par jour »: the last seven days.
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end.getTime() - (7 - index) * DAY);
    return {
      day,
      count: applications.filter((a) => dayStart(a.createdAt).getTime() === day.getTime()).length,
    };
  });
  const weights = weightsForJob(active, job.matchingWeights);
  const totalWeight = criterionKeys.reduce((sum, key) => sum + (weights.values[key] ?? 0), 0) || 1;
  const example = top[0] ? parseExplanation(top[0].matchExplanation) : null;
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    status: job.status,
    description: job.description,
    responsibilities: job.responsibilities,
    contractType: job.contractType,
    city: job.city,
    remote: job.remote,
    closesAt: job.closesAt,
    publishedAt: job.publishedAt,
    openings: job.openings,
    department: department?.name ?? null,
    skills: job.skills.map((s) => ({ name: s.skill.name, required: s.importance === "required" })),
    daysLeft: job.closesAt
      ? Math.max(0, Math.ceil((job.closesAt.getTime() - now.getTime()) / DAY))
      : null,
    views: { total: viewsTotal, series },
    applications: applications.length,
    high,
    funnel: [
      { key: "views", count: viewsTotal },
      { key: "applications", count: applications.length },
      { key: "screening", count: reached(FUNNEL_KINDS[0]) },
      { key: "interview", count: reached(FUNNEL_KINDS[1]) },
      { key: "offer", count: reached(FUNNEL_KINDS[2]) },
    ],
    sources: (["direct", "invitation", "talent_search"] as const).map((source) => ({
      source,
      count: applications.filter((a) => a.source === source).length,
    })),
    week,
    top: top.map((a) => ({ id: a.id, name: a.profile.user.name, score: a.matchScore ?? 0 })),
    weights: criterionKeys
      .map((key) => ({ key, share: Math.round(((weights.values[key] ?? 0) / totalWeight) * 100) }))
      .filter((w) => w.share > 0)
      .sort((a, b) => b.share - a.share),
    example:
      example && top[0]
        ? {
            name: top[0].profile.user.name,
            score: example.score,
            points: [...example.criteria]
              .map((c) => ({
                key: c.key,
                points: Math.round((c.weight * c.value * 100) / totalWeight),
              }))
              .filter((c) => c.points > 0)
              .sort((a, b) => b.points - a.points),
          }
        : null,
  };
}

export type OfferV3Detail = Awaited<ReturnType<typeof offerV3>>;

export type NewOfferData = {
  job: Awaited<ReturnType<typeof getOrgJob>> | null;
  org: { name: string; description: string | null };
  stages: { name: string; kind: string }[];
  team: { id: string; name: string; lead: boolean; you: boolean }[];
  recent: { id: string; title: string; department: string | null }[];
  weights: { key: string; share: number }[];
  weightsEditable: boolean;
};

/** What « Nouvelle offre » v3 shows besides the offer: the organization, stages, team, offers to copy. */
export async function newOfferV3Data(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string | null,
): Promise<NewOfferData> {
  const job = jobId ? await getOrgJob(db, ctx, jobId) : null;
  const [org, stages, members, recent, active, allowed] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true, description: true },
    }),
    job
      ? db.pipelineStage.findMany({
          where: { jobId: job.id, kind: { notIn: ["hired", "rejected"] } },
          orderBy: { order: "asc" },
          select: { name: true, kind: true },
        })
      : [],
    job
      ? db.user.findMany({
          where: {
            id: {
              in: [
                ...new Set(
                  [
                    job.assignedToId,
                    job.createdById,
                    ...job.assignments.map((a) => a.userId),
                  ].filter((value): value is string => Boolean(value)),
                ),
              ],
            },
          },
          select: { id: true, name: true },
        })
      : [],
    db.job.findMany({
      where: {
        AND: [await jobScope(db, ctx), { status: { in: ["published", "paused", "closed"] } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, department: { select: { name: true } } },
    }),
    activeWeights(db),
    can(db, { type: "organization", id: ctx.organizationId }, WEIGHTS_ENTITLEMENT),
  ]);
  const weights = weightsForJob(active, job?.matchingWeights);
  const total = criterionKeys.reduce((sum, key) => sum + (weights.values[key] ?? 0), 0) || 1;
  const lead = job?.assignedToId ?? job?.createdById ?? null;
  return {
    job,
    org,
    stages: stages.length
      ? stages
      : defaultStages.filter((s) => s.kind !== "hired" && s.kind !== "rejected"),
    team: members
      .map((m) => ({ id: m.id, name: m.name, lead: m.id === lead, you: m.id === ctx.userId }))
      .sort((a, b) => Number(b.lead) - Number(a.lead)),
    recent: recent.map((o) => ({
      id: o.id,
      title: o.title,
      department: o.department?.name ?? null,
    })),
    weights: criterionKeys
      .map((key) => ({ key, share: Math.round(((weights.values[key] ?? 0) / total) * 100) }))
      .filter((w) => w.share > 0),
    weightsEditable: allowed && hirePermissions(ctx.role).manage,
  };
}
