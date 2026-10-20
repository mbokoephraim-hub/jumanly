/**
 * What the recruiting report PDF adds to the « Rapports » page (brief recruteur § 2.15, modèle
 * docs/refonte-mobile/modeles-recruteur/rapport-recrutement): the offers with their views,
 * applications, interviews and first-answer delay; the delays of first answers in three bands; the
 * interviews by mode; Orbi's month. Aggregates only: no person is named or ranked (golden rule
 * n° 5); every query is filtered by the organization (golden rule n° 6).
 */
import type { JobStatus, PrismaClient } from "@/generated/prisma/client";
import { AI_CREDITS_KEY } from "@/server/ai";
import { usage } from "@/server/entitlements";
import type { HireContext } from "./hire";
import { GROUP_REPLY_EVENT } from "./hire-group-replies";

const DAY = 86_400_000;
const ANALYSIS_EVENT = "orbi_analysis";
const answerEvents = ["viewed", "stage_changed", "decision", "message"];

export type ReportOffer = {
  title: string;
  status: JobStatus;
  views: number;
  applications: number;
  interviews: number;
  /** Average days to the team's first gesture, or null. */
  delay: number | null;
};

export async function reportPdfData(
  db: PrismaClient,
  ctx: HireContext,
  range: { from: Date; to: Date },
) {
  const organizationId = ctx.organizationId;
  const inPeriod = { gte: range.from, lte: range.to };
  const jobs = await db.job.findMany({
    where: {
      organizationId,
      OR: [
        { status: { in: ["published", "paused", "pending_review"] } },
        { applications: { some: { createdAt: inPeriod } } },
      ],
    },
    orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
    take: 12,
    select: { id: true, title: true, status: true },
  });
  const ids = jobs.map((job) => job.id);
  const [views, interviews, applications, members, groupReplies, analysed] = await Promise.all([
    db.jobViewDay.groupBy({
      by: ["jobId"],
      where: { jobId: { in: ids }, day: inPeriod },
      _sum: { count: true },
    }),
    db.interview.findMany({
      where: {
        organizationId,
        status: { notIn: ["canceled", "declined"] },
        OR: [{ startsAt: inPeriod }, { startsAt: null, updatedAt: inPeriod }],
      },
      select: { mode: true, application: { select: { jobId: true } } },
    }),
    db.application.findMany({
      where: { job: { organizationId }, createdAt: inPeriod },
      select: {
        jobId: true,
        createdAt: true,
        events: {
          where: { actorId: { not: null }, type: { in: answerEvents } },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    db.membership.findMany({ where: { organizationId }, select: { userId: true } }),
    db.applicationEvent.count({
      where: {
        type: { in: [GROUP_REPLY_EVENT, "decision"] },
        createdAt: inPeriod,
        application: { job: { organizationId } },
        payload: { path: ["toKind"], equals: "rejected" },
      },
    }),
    db.applicationEvent.count({
      where: {
        type: ANALYSIS_EVENT,
        createdAt: inPeriod,
        application: { job: { organizationId } },
      },
    }),
  ]);
  const drafts = await db.aiUsage.count({
    where: {
      userId: { in: members.map((member) => member.userId) },
      feature: "message_draft",
      status: "ok",
      createdAt: inPeriod,
    },
  });
  const credits = await usage(db, { type: "organization", id: organizationId }, AI_CREDITS_KEY);

  const delays = applications.flatMap((application) =>
    application.events[0]
      ? [(application.events[0].createdAt.getTime() - application.createdAt.getTime()) / DAY]
      : [],
  );
  const bands = {
    fast: delays.filter((days) => days <= 2).length,
    week: delays.filter((days) => days > 2 && days <= 7).length,
    slow: delays.filter((days) => days > 7).length,
  };
  const share = (count: number) =>
    delays.length === 0 ? null : Math.round((count / delays.length) * 100);
  const offers: ReportOffer[] = jobs.map((job) => {
    const mine = applications.filter((application) => application.jobId === job.id);
    const own = mine.flatMap((application) =>
      application.events[0]
        ? [(application.events[0].createdAt.getTime() - application.createdAt.getTime()) / DAY]
        : [],
    );
    return {
      title: job.title,
      status: job.status,
      views: views.find((row) => row.jobId === job.id)?._sum.count ?? 0,
      applications: mine.length,
      interviews: interviews.filter((row) => row.application.jobId === job.id).length,
      delay: own.length ? Math.round(own.reduce((a, b) => a + b, 0) / own.length) : null,
    };
  });
  const modes = new Map<string, number>();
  for (const interview of interviews)
    modes.set(interview.mode, (modes.get(interview.mode) ?? 0) + 1);
  return {
    offers,
    delays: { fast: share(bands.fast), week: share(bands.week), slow: share(bands.slow) },
    interviewModes: [...modes.entries()].map(([mode, count]) => ({ mode, count })),
    rejectionReplies: groupReplies,
    orbi: {
      analysed,
      drafts,
      credits: credits.limit < 0 ? null : { used: credits.used, limit: credits.limit },
    },
  };
}
export type ReportPdfData = Awaited<ReturnType<typeof reportPdfData>>;
