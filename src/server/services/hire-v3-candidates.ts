/**
 * Candidats of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, `V.candidats`):
 * the offer shown on top, its candidates by stage (pipeline), in a list, and the three best side
 * by side. Real data only; every query goes through `jobScope` (golden rule n° 6). Orbi ranks,
 * the team decides (golden rule n° 3): nothing here moves a candidate by itself.
 */
import type { PrismaClient, StageKind } from "@/generated/prisma/client";
import { parseExplanation } from "@/server/matching/service";
import { candidateOffers } from "./hire-candidates";
import { level } from "@/server/entitlements";
import { hirePermissions, HireError, jobScope, recordView, type HireContext } from "./hire";
import { HIGH_POTENTIAL } from "./hire-v3-offers";

const DAY = 86_400_000;

export const CANDIDATE_CLASSES = ["fort", "cons", "lim"] as const;
export type CandidateClass = (typeof CANDIDATE_CLASSES)[number];
export const classOf = (score: number): CandidateClass =>
  score >= HIGH_POTENTIAL ? "fort" : score >= 50 ? "cons" : "lim";

export async function candidatesV3(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string | null,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const offers = await candidateOffers(db, ctx);
  const focus =
    offers.find((offer) => offer.id === jobId) ??
    [...offers]
      .filter((offer) => offer.status === "published")
      .sort((a, b) => b._count.applications - a._count.applications)[0] ??
    offers[0] ??
    null;
  if (!focus) return { offers: [], job: null, stages: [], candidates: [], high: 0 };
  const [job, applications] = await Promise.all([
    db.job.findFirstOrThrow({
      where: { AND: [{ id: focus.id }, await jobScope(db, ctx)] },
      select: {
        id: true,
        title: true,
        status: true,
        city: true,
        remote: true,
        contractType: true,
        closesAt: true,
        openings: true,
        department: { select: { name: true } },
        stages: { orderBy: { order: "asc" }, select: { id: true, name: true, kind: true } },
      },
    }),
    db.application.findMany({
      where: { jobId: focus.id, status: { not: "withdrawn" } },
      orderBy: [{ matchScore: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
      select: {
        id: true,
        createdAt: true,
        source: true,
        status: true,
        stageId: true,
        matchScore: true,
        matchExplanation: true,
        profile: {
          select: {
            headline: true,
            user: { select: { name: true, city: true } },
            skills: {
              orderBy: { level: "desc" },
              take: 1,
              select: { skill: { select: { name: true } } },
            },
          },
        },
      },
    }),
  ]);
  const candidates = applications.map((a) => {
    const explanation = parseExplanation(a.matchExplanation);
    return {
      id: a.id,
      name: a.profile.user.name,
      role: a.profile.headline ?? null,
      city: a.profile.user.city ?? null,
      source: a.source,
      status: a.status,
      stageId: a.stageId,
      score: a.matchScore ?? 0,
      scored: a.matchScore !== null,
      skill: a.profile.skills[0]?.skill.name ?? null,
      criteria: explanation
        ? explanation.criteria
            .filter((c) => c.weight > 0)
            .map((c) => ({ key: c.key, value: Math.round(c.value * 100) }))
        : [],
    };
  });
  return {
    offers: offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      live: offer.status === "published",
      count: offer._count.applications,
    })),
    job: {
      ...job,
      department: job.department?.name ?? null,
      daysLeft: job.closesAt
        ? Math.max(0, Math.ceil((job.closesAt.getTime() - now.getTime()) / DAY))
        : null,
    },
    // The columns of the pipeline: every stage but « Non retenu » (a decision, never a column).
    stages: job.stages.filter((stage) => stage.kind !== "rejected") as {
      id: string;
      name: string;
      kind: StageKind;
    }[],
    candidates,
    high: candidates.filter((c) => c.score >= HIGH_POTENTIAL).length,
  };
}

export type CandidatesV3 = Awaited<ReturnType<typeof candidatesV3>>;

/**
 * La fiche d'un candidat in the web app v3 (`V.candidat`): opening it is journaled (golden rule
 * n° 5, `recordView`), then the score and its « Pourquoi ? », the skills asked against the
 * person's, the path, the documents, the team's opinions, and the place in the offer's list.
 */
export async function candidateV3(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  now = new Date(),
) {
  const application = await recordView(db, ctx, applicationId, now);
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [views, order, scorecards, matchingLevel, languages] = await Promise.all([
    db.auditLog.count({
      where: {
        organizationId: ctx.organizationId,
        action: "profile.view",
        targetId: application.profileId,
      },
    }),
    db.application.findMany({
      where: { jobId: application.jobId, status: { not: "withdrawn" } },
      orderBy: [{ matchScore: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
      select: { id: true },
    }),
    db.scorecard.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ratings: true,
        comment: true,
        createdAt: true,
        reviewerId: true,
        reviewer: { select: { name: true } },
      },
    }),
    level(db, subject, "hire.matching.level"),
    db.talentProfile.findUnique({
      where: { id: application.profileId },
      select: { languages: true, availability: true, availableFrom: true },
    }),
  ]);
  const ids = order.map((row) => row.id);
  const index = ids.indexOf(application.id);
  const explanation =
    matchingLevel === "none" ? null : parseExplanation(application.matchExplanation);
  const levelOf = new Map(
    application.profile.skills.map((s) => [s.skill.name.toLowerCase(), s.level]),
  );
  const months = application.profile.experiences.reduce((sum, e) => {
    const end = e.endDate ?? now;
    return sum + Math.max(0, (end.getTime() - e.startDate.getTime()) / (30.44 * DAY));
  }, 0);
  const rating = (value: unknown) => {
    const list = Array.isArray(value) ? (value as { rating?: unknown }[]) : [];
    const values = list.map((r) => Number(r.rating)).filter((n) => n >= 1 && n <= 5);
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  };
  const reviews = scorecards.map((s) => ({
    id: s.id,
    name: s.reviewer.name,
    you: s.reviewerId === ctx.userId,
    rating: rating(s.ratings),
    comment: s.comment,
    at: s.createdAt,
  }));
  const rated = reviews.filter((r) => r.rating !== null);
  return {
    application,
    position: {
      index,
      total: ids.length,
      prev: ids[index - 1] ?? null,
      next: ids[index + 1] ?? null,
    },
    views,
    explanation,
    // The skills asked by the offer against the person's level (1 to 5, shown out of 100).
    skills: application.job.skills.map((s) => ({
      name: s.skill.name,
      required: s.importance === "required",
      expected: Math.min(100, s.minLevel * 20),
      level: Math.min(100, (levelOf.get(s.skill.name.toLowerCase()) ?? 0) * 20),
    })),
    years: Math.floor(months / 12),
    languages: Array.isArray(languages?.languages)
      ? (languages.languages as { code?: string; name?: string; level?: string }[])
      : [],
    availability: languages?.availability ?? null,
    availableFrom: languages?.availableFrom ?? null,
    reviews,
    average: rated.length
      ? Math.round((rated.reduce((a, r) => a + (r.rating ?? 0), 0) / rated.length) * 10) / 10
      : null,
  };
}

export type CandidateV3 = Awaited<ReturnType<typeof candidateV3>>;
