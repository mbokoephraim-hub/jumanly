/**
 * Offres of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, screens 05-09,
 * `V.offres` and `offStats()`): the cards three by line and the statistics of a period. Real
 * figures only (golden rule n° 11), every query through `jobScope` (golden rule n° 6).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { jobScope, type HireContext } from "./hire";
import { listOffers } from "./hire-offers";

const DAY = 86_400_000;
/** From this score a candidate counts as « Fort potentiel » (classes of partie 08). */
export const HIGH_POTENTIAL = 75;

export async function offersV3(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const offers = await listOffers(db, ctx, now);
  const ids = offers.map((offer) => offer.id);
  const [details, byStage, high] = await Promise.all([
    db.job.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        openings: true,
        description: true,
        requirements: true,
        department: { select: { name: true } },
      },
    }),
    db.application.groupBy({
      by: ["jobId", "stageId"],
      where: { jobId: { in: ids }, status: "active" },
      _count: { _all: true },
    }),
    db.application.groupBy({
      by: ["jobId"],
      where: { jobId: { in: ids }, matchScore: { gte: HIGH_POTENTIAL } },
      _count: { _all: true },
    }),
  ]);
  const stages = await db.pipelineStage.findMany({
    where: { jobId: { in: ids } },
    select: { id: true, kind: true },
  });
  const kindOf = new Map(stages.map((stage) => [stage.id, stage.kind]));
  return offers.map((offer) => {
    const detail = details.find((d) => d.id === offer.id);
    const rows = byStage.filter((row) => row.jobId === offer.id);
    const count = (kinds: string[]) =>
      rows
        .filter((row) => kinds.includes(kindOf.get(row.stageId) ?? ""))
        .reduce((sum, row) => sum + row._count._all, 0);
    const description = (detail?.description ?? "").trim();
    // The four steps of the offer (poste, description, candidature, vérifier) a draft has done.
    const steps =
      1 + (description.length >= 80 ? 1 : 0) + ((detail?.requirements.length ?? 0) > 0 ? 1 : 0);
    return {
      ...offer,
      department: detail?.department?.name ?? null,
      openings: detail?.openings ?? 1,
      describedEnough: description.length >= 80,
      steps,
      split: {
        fresh: count(["new"]),
        screening: count(["screening", "test"]),
        interview: count(["interview", "offer"]),
      },
      highPotential: high.find((row) => row.jobId === offer.id)?._count._all ?? 0,
      daysLeft: offer.closesAt
        ? Math.max(0, Math.ceil((offer.closesAt.getTime() - now.getTime()) / DAY))
        : null,
    };
  });
}

export type OfferV3 = Awaited<ReturnType<typeof offersV3>>[number];

export const STAT_PERIODS = [7, 30, 90] as const;
export type StatPeriod = (typeof STAT_PERIODS)[number];

const dayStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/** The statistics of the offers over the last `days` days and the period before. */
export async function offerStats(
  db: PrismaClient,
  ctx: HireContext,
  days: StatPeriod,
  now = new Date(),
) {
  const scope = await jobScope(db, ctx);
  const end = new Date(dayStart(now).getTime() + DAY);
  const start = new Date(end.getTime() - days * DAY);
  const before = new Date(start.getTime() - days * DAY);
  const jobs = await db.job.findMany({
    where: { AND: [scope, { status: { not: "archived" } }] },
    select: { id: true, title: true, status: true },
  });
  const ids = jobs.map((job) => job.id);
  const [views, applications, interviews, previousInterviews] = await Promise.all([
    db.jobViewDay.findMany({
      where: { jobId: { in: ids }, day: { gte: before, lt: end } },
      select: { jobId: true, day: true, count: true },
    }),
    db.application.findMany({
      where: { jobId: { in: ids }, createdAt: { gte: before, lt: end } },
      select: { jobId: true, createdAt: true, source: true, matchScore: true },
    }),
    db.interview.count({
      where: {
        organizationId: ctx.organizationId,
        application: { jobId: { in: ids } },
        status: { in: ["confirmed", "done"] },
        startsAt: { gte: start, lt: end },
      },
    }),
    db.interview.count({
      where: {
        organizationId: ctx.organizationId,
        application: { jobId: { in: ids } },
        status: { in: ["confirmed", "done"] },
        startsAt: { gte: before, lt: start },
      },
    }),
  ]);
  const series = (from: Date, pick: (d: Date) => number) =>
    Array.from({ length: days }, (_, index) => pick(new Date(from.getTime() + index * DAY)));
  const viewsOn = (day: Date) =>
    views
      .filter((v) => dayStart(v.day).getTime() === day.getTime())
      .reduce((s, v) => s + v.count, 0);
  const appsOn = (day: Date) =>
    applications.filter((a) => dayStart(a.createdAt).getTime() === day.getTime()).length;
  const now_ = applications.filter((a) => a.createdAt >= start);
  const viewsNow = views.filter((v) => v.day >= start).reduce((s, v) => s + v.count, 0);
  const viewsBefore = views.filter((v) => v.day < start).reduce((s, v) => s + v.count, 0);
  const appsBefore = applications.length - now_.length;
  const rate = (a: number, v: number) => (v ? Math.round((a / v) * 1000) / 10 : 0);
  return {
    days,
    start,
    views: { total: viewsNow, before: viewsBefore, series: series(start, viewsOn) },
    applications: {
      total: now_.length,
      before: appsBefore,
      series: series(start, appsOn),
      previous: series(before, appsOn),
    },
    rate: { total: rate(now_.length, viewsNow), before: rate(appsBefore, viewsBefore) },
    interviews: { total: interviews, before: previousInterviews },
    sources: (["direct", "invitation", "talent_search"] as const).map((source) => ({
      source,
      count: now_.filter((a) => a.source === source).length,
    })),
    offers: jobs
      .filter((job) => job.status !== "draft")
      .map((job) => {
        const v = views
          .filter((row) => row.jobId === job.id && row.day >= start)
          .reduce((s, row) => s + row.count, 0);
        const apps = now_.filter((a) => a.jobId === job.id);
        return {
          id: job.id,
          title: job.title,
          views: v,
          applications: apps.length,
          rate: rate(apps.length, v),
          high: apps.filter((a) => (a.matchScore ?? 0) >= HIGH_POTENTIAL).length,
        };
      })
      .sort((a, b) => b.applications - a.applications),
  };
}

export type OfferStats = Awaited<ReturnType<typeof offerStats>>;

/**
 * « Rapport des offres » (prototype v3, `V.rapportoffres`): the statistics of the last 30 days,
 * the offers with their figures, where the candidates stand, the delay to the first interview,
 * and the facts the pistes are drawn from. Real figures only.
 */
export async function offersReport(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const [stats, offers] = await Promise.all([offerStats(db, ctx, 30, now), offersV3(db, ctx, now)]);
  const ids = offers.filter((o) => o.status !== "draft").map((o) => o.id);
  const [stages, interviews, bySource] = await Promise.all([
    db.application.findMany({
      where: { jobId: { in: ids }, createdAt: { gte: stats.start } },
      select: { stage: { select: { kind: true } } },
    }),
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        application: { jobId: { in: ids } },
        startsAt: { gte: stats.start },
        status: { in: ["confirmed", "done"] },
      },
      select: { startsAt: true, application: { select: { jobId: true, createdAt: true } } },
    }),
    db.application.groupBy({
      by: ["jobId", "source"],
      where: { jobId: { in: ids }, createdAt: { gte: stats.start } },
      _count: { _all: true },
    }),
  ]);
  const reached = (kinds: string[]) => stages.filter((a) => kinds.includes(a.stage.kind)).length;
  const funnel = [
    { key: "received", count: stages.length },
    { key: "screening", count: reached(["screening", "test", "interview", "offer", "hired"]) },
    { key: "test", count: reached(["test", "interview", "offer", "hired"]) },
    { key: "interview", count: reached(["interview", "offer", "hired"]) },
    { key: "offer", count: reached(["offer", "hired"]) },
  ];
  const delayOf = (rows: typeof interviews) => {
    const firsts = new Map<string, number>();
    for (const row of rows) {
      const key = `${row.application.jobId}:${row.application.createdAt.getTime()}`;
      const days = ((row.startsAt?.getTime() ?? 0) - row.application.createdAt.getTime()) / DAY;
      if (days >= 0 && (!firsts.has(key) || days < firsts.get(key)!)) firsts.set(key, days);
    }
    const values = [...firsts.values()];
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  };
  return {
    ...stats,
    end: new Date(stats.start.getTime() + 30 * DAY - 1),
    funnel,
    delay: delayOf(interviews),
    offers: offers
      .filter((o) => o.status !== "draft" && o.status !== "pending_review")
      .map((o) => {
        const row = stats.offers.find((s) => s.id === o.id);
        return {
          ...o,
          period: row ?? { id: o.id, title: o.title, views: 0, applications: 0, rate: 0, high: 0 },
          delay: delayOf(interviews.filter((i) => i.application.jobId === o.id)),
          sources: (["direct", "invitation", "talent_search"] as const).map((source) => ({
            source,
            count: bySource.find((b) => b.jobId === o.id && b.source === source)?._count._all ?? 0,
          })),
        };
      }),
  };
}

export type OffersReport = Awaited<ReturnType<typeof offersReport>>;
