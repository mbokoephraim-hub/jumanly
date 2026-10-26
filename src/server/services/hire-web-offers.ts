/**
 * The offers of the recruiter on a computer (Modèle B, lot N2, captures 034 to 037 and 090): the
 * figures of the last thirty days, the table of the offers and, for one offer, where its
 * applications stand and where they come from. Every read goes through `jobScope` or
 * `getOrgJob` (golden rule n° 6); the figures are the real ones.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { getOrgJob, jobScope, type HireContext } from "./hire";
import { listOffers, offerStages } from "./hire-offers";

const DAY = 86_400_000;

/** « Ont reçu une réponse »: the team moved the application or decided, at least once. */
const ANSWERED = ["stage_changed", "decision"] as const;

/** First answer delay (days, one decimal) and answered share of a set of applications. */
function answers(rows: { createdAt: Date; status: string; events: { createdAt: Date }[] }[]) {
  const answered = rows.filter((row) => row.events.length > 0 || row.status !== "active");
  const delays = rows
    .filter((row) => row.events[0])
    .map((row) => (row.events[0]!.createdAt.getTime() - row.createdAt.getTime()) / DAY);
  return {
    answeredShare: rows.length ? answered.length / rows.length : null,
    responseDays: delays.length
      ? Math.round((delays.reduce((sum, value) => sum + value, 0) / delays.length) * 10) / 10
      : null,
  };
}

const answerSelect = {
  createdAt: true,
  status: true,
  events: {
    where: { type: { in: [...ANSWERED] } },
    orderBy: { createdAt: "asc" as const },
    take: 1,
    select: { createdAt: true },
  },
};

/** « Offres » (capture 034): the four figures, then each offer with its applications of the week. */
export async function webOffers(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const scope = await jobScope(db, ctx);
  const month = new Date(now.getTime() - 30 * DAY);
  const week = new Date(now.getTime() - 7 * DAY);
  const [offers, recent, fresh] = await Promise.all([
    listOffers(db, ctx, now),
    db.application.findMany({
      where: { job: scope, createdAt: { gte: month } },
      select: answerSelect,
    }),
    db.application.groupBy({
      by: ["jobId"],
      where: { job: scope, createdAt: { gte: week } },
      _count: { _all: true },
    }),
  ]);
  const freshOf = (jobId: string) => fresh.find((row) => row.jobId === jobId)?._count._all ?? 0;
  return {
    figures: {
      applications: recent.length,
      week: fresh.reduce((sum, row) => sum + row._count._all, 0),
      ...answers(recent),
    },
    offers: offers.map((offer) => ({ ...offer, week: freshOf(offer.id) })),
  };
}

export type WebOffers = Awaited<ReturnType<typeof webOffers>>;

/** « Aperçu » of an offer (capture 035): its figures, its stages and the sources. */
export async function webOfferOverview(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  now = new Date(),
) {
  const job = await getOrgJob(db, ctx, jobId);
  const week = new Date(now.getTime() - 7 * DAY);
  const [views, applications, stages, sources] = await Promise.all([
    db.jobViewDay.aggregate({ where: { jobId: job.id }, _sum: { count: true } }),
    db.application.findMany({ where: { jobId: job.id }, select: answerSelect }),
    offerStages(db, ctx, job.id),
    db.application.groupBy({
      by: ["source"],
      where: { jobId: job.id },
      _count: { _all: true },
    }),
  ]);
  return {
    views: views._sum.count ?? 0,
    applications: applications.length,
    week: applications.filter((row) => row.createdAt >= week).length,
    answeredShare: answers(applications).answeredShare,
    stages,
    sources: (["direct", "invitation", "talent_search"] as const).map((source) => ({
      source,
      count: sources.find((row) => row.source === source)?._count._all ?? 0,
    })),
  };
}

export type WebOfferOverview = Awaited<ReturnType<typeof webOfferOverview>>;
