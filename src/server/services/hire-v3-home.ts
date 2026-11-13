/**
 * The home of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, screens 01-03,
 * `V.accueil`): the applications of the period with their offers, four figures, the chart
 * « Candidatures reçues », the profiles to meet, what is left to do, where the candidates stand
 * and the week's interviews. Real figures only (golden rule n° 11): a figure that has no source
 * yet stays at zero. Everything goes through `jobScope` (golden rule n° 6).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { hireToday } from "./hire-today";
import { hirePermissions, jobScope, type HireContext } from "./hire";
import { myTasks } from "./org-team";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const HOME_PERIODS = ["jour", "semaine", "mois"] as const;
export type HomePeriod = (typeof HOME_PERIODS)[number];

/** The buckets of a period: today by two hours, this week by day, the last four weeks. */
export function periodBuckets(period: HomePeriod, now: Date) {
  if (period === "jour") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    // 8 h, 10 h … 18 h: the working day, the first and last buckets catch the night.
    const hours = [8, 10, 12, 14, 16, 18];
    return hours.map((hour, index) => ({
      key: `h${hour}`,
      hour,
      from: index === 0 ? start : new Date(start.getTime() + hour * HOUR),
      to:
        index === hours.length - 1
          ? new Date(start.getTime() + DAY)
          : new Date(start.getTime() + hours[index + 1]! * HOUR),
    }));
  }
  if (period === "semaine") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => ({
      key: `d${index}`,
      day: index,
      from: new Date(start.getTime() + index * DAY),
      to: new Date(start.getTime() + (index + 1) * DAY),
    }));
  }
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY);
  return Array.from({ length: 4 }, (_, index) => ({
    key: `w${index}`,
    week: index + 1,
    from: new Date(end.getTime() - (4 - index) * 7 * DAY),
    to: new Date(end.getTime() - (3 - index) * 7 * DAY),
  }));
}

/** The change from one period to the one before, in %, or null when there is nothing to compare. */
export function change(now: number, before: number) {
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

export async function hireHome(
  db: PrismaClient,
  ctx: HireContext,
  period: HomePeriod,
  now = new Date(),
) {
  const scope = await jobScope(db, ctx);
  const reads = hirePermissions(ctx.role).readApplications;
  const buckets = periodBuckets(period, now);
  const from = buckets[0]!.from;
  const to = buckets[buckets.length - 1]!.to;
  const span = to.getTime() - from.getTime();
  const before = { gte: new Date(from.getTime() - span), lt: from };
  const within = { gte: from, lt: to };
  const interviewWhere = {
    organizationId: ctx.organizationId,
    application: { job: scope },
    status: { in: ["confirmed" as const, "done" as const] },
  };

  const [
    applications,
    previousApplications,
    shortlisted,
    previousShortlisted,
    interviews,
    previousInterviews,
    decisions,
    offers,
    today,
    tasks,
    week,
  ] = await Promise.all([
    db.application.findMany({
      where: { job: scope, createdAt: within },
      select: { createdAt: true, shortlistedAt: true },
    }),
    db.application.count({ where: { job: scope, createdAt: before } }),
    db.application.count({ where: { job: scope, shortlistedAt: within } }),
    db.application.count({ where: { job: scope, shortlistedAt: before } }),
    db.interview.count({ where: { ...interviewWhere, startsAt: within } }),
    db.interview.count({ where: { ...interviewWhere, startsAt: before } }),
    // « Délai moyen »: from the application to the decision, over the last 90 days.
    db.applicationEvent.findMany({
      where: {
        type: "decision",
        createdAt: { gte: new Date(now.getTime() - 90 * DAY) },
        application: { job: scope },
      },
      select: { createdAt: true, application: { select: { createdAt: true } } },
      take: 500,
    }),
    db.job.findMany({
      where: { AND: [scope, { status: { in: ["published", "paused"] } }] },
      orderBy: [{ status: "asc" }, { publishedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        status: true,
        closesAt: true,
        department: { select: { name: true } },
        _count: { select: { applications: true } },
        stages: { orderBy: { order: "asc" }, select: { id: true, name: true, kind: true } },
      },
    }),
    hireToday(db, ctx, now),
    myTasks(db, ctx, now),
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        application: { job: scope },
        status: "confirmed",
        startsAt: { gte: now, lt: new Date(now.getTime() + 7 * DAY) },
      },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: {
        id: true,
        startsAt: true,
        mode: true,
        durationMinutes: true,
        application: { select: { profile: { select: { user: { select: { name: true } } } } } },
      },
    }),
  ]);

  const bars = buckets.map((bucket) => {
    const inside = applications.filter(
      (a) => a.createdAt >= bucket.from && a.createdAt < bucket.to,
    );
    return {
      ...bucket,
      received: inside.length,
      shortlisted: inside.filter((a) => a.shortlistedAt).length,
    };
  });
  const delays = decisions.map(
    (event) => (event.createdAt.getTime() - event.application.createdAt.getTime()) / DAY,
  );
  const delay = delays.length
    ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)
    : null;

  // « Choisir qui rencontrer » and the funnel: the live offer with the most applications.
  const focus =
    [...offers]
      .filter((offer) => offer.status === "published")
      .sort((a, b) => b._count.applications - a._count.applications)[0] ?? null;
  const [best, stageCounts] =
    focus && reads
      ? await Promise.all([
          db.application.findMany({
            where: { jobId: focus.id, status: "active", matchScore: { gte: 70 } },
            orderBy: { matchScore: "desc" },
            take: 6,
            select: {
              id: true,
              matchScore: true,
              profile: { select: { user: { select: { name: true } } } },
            },
          }),
          db.application.groupBy({
            by: ["stageId"],
            where: { jobId: focus.id },
            _count: { _all: true },
          }),
        ])
      : [[], []];
  const countOf = new Map(stageCounts.map((row) => [row.stageId, row._count._all]));
  // Each stage counts those who reached it or went further (a funnel).
  const funnel = focus
    ? focus.stages
        .filter((stage) => stage.kind !== "rejected" && stage.kind !== "hired")
        .map((stage, index, list) => ({
          id: stage.id,
          name: stage.name,
          count: list.slice(index).reduce((sum, s) => sum + (countOf.get(s.id) ?? 0), 0),
        }))
    : [];

  return {
    period,
    bars,
    received: applications.length,
    receivedChange: change(applications.length, previousApplications),
    shortlisted,
    shortlistedChange: change(shortlisted, previousShortlisted),
    interviews,
    interviewsChange: change(interviews, previousInterviews),
    delay,
    offers: offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      live: offer.status === "published",
      department: offer.department?.name ?? null,
      daysLeft: offer.closesAt
        ? Math.max(0, Math.ceil((offer.closesAt.getTime() - now.getTime()) / DAY))
        : null,
      applications: offer._count.applications,
    })),
    liveOffers: offers.filter((offer) => offer.status === "published").length,
    focus: focus ? { id: focus.id, title: focus.title } : null,
    best: best.map((application) => ({
      id: application.id,
      name: application.profile.user.name,
      score: application.matchScore ?? 0,
    })),
    funnel,
    today,
    tasks: tasks.filter((task) => task.status !== "done"),
    week: week.map((interview) => ({
      id: interview.id,
      startsAt: interview.startsAt!,
      mode: interview.mode,
      minutes: interview.durationMinutes,
      name: interview.application.profile.user.name,
    })),
  };
}

export type HireHome = Awaited<ReturnType<typeof hireHome>>;
