/**
 * Recruiting reports (E8, `reports.level`, `reports.export`). Each level adds sections to the
 * previous one: basic < stats < advanced < consolidated < custom. Everything is computed on the
 * organization's own data (golden rule n° 6) and only aggregates leave this module, except the
 * names of the organization's members in « activité par recruteur ».
 */
import { z } from "zod";
import type { PrismaClient, StageKind } from "@/generated/prisma/client";
import { level } from "@/server/entitlements";
import { hirePermissions, HireError, type HireContext } from "./hire";

export const reportLevels = ["basic", "stats", "advanced", "consolidated", "custom"] as const;
export type ReportLevel = (typeof reportLevels)[number];

export function reportRank(value: string) {
  return Math.max(0, reportLevels.indexOf(value as ReportLevel));
}

export const reportPeriods = ["30d", "90d", "12m", "custom"] as const;
const DAY = 86_400_000;

export const periodSchema = z.object({
  periode: z.enum(reportPeriods).catch("30d"),
  du: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  au: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
});

export function periodRange(raw: Record<string, unknown>, now = new Date()) {
  const input = periodSchema.parse(raw);
  if (input.periode === "custom" && input.du && input.au) {
    const from = new Date(`${input.du}T00:00:00Z`);
    const to = new Date(`${input.au}T23:59:59Z`);
    if (from < to && to.getTime() - from.getTime() <= 3 * 366 * DAY)
      return { period: input.periode, from, to };
  }
  const days = input.periode === "90d" ? 90 : input.periode === "12m" ? 365 : 30;
  return {
    period: input.periode === "custom" ? ("30d" as const) : input.periode,
    from: new Date(now.getTime() - days * DAY),
    to: now,
  };
}

const funnelKinds: StageKind[] = ["new", "screening", "test", "interview", "offer", "hired"];

export type HireReport = Awaited<ReturnType<typeof buildReport>>;

const average = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
const round1 = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

/** Viewers, administrators and owners read reports; recruiters too (their own organization). */
export async function buildReport(
  db: PrismaClient,
  ctx: HireContext,
  range: { from: Date; to: Date },
) {
  const permissions = hirePermissions(ctx.role);
  if (!permissions.manage && ctx.role !== "viewer") throw new HireError("forbidden");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const reportsLevel = await level(db, subject, "reports.level");
  const rank = reportRank(reportsLevel);
  const inPeriod = { gte: range.from, lte: range.to };
  const organizationId = ctx.organizationId;

  const [activeJobs, interviews, applications] = await Promise.all([
    db.job.count({ where: { organizationId, status: { in: ["published", "pending_review"] } } }),
    db.interview.count({
      where: {
        organizationId,
        status: { in: ["confirmed", "done"] },
        OR: [{ startsAt: inPeriod }, { startsAt: null, updatedAt: inPeriod }],
      },
    }),
    db.application.findMany({
      where: { job: { organizationId }, createdAt: inPeriod },
      select: {
        id: true,
        source: true,
        status: true,
        createdAt: true,
        jobId: true,
        stage: { select: { kind: true } },
        job: {
          select: {
            title: true,
            team: { select: { name: true } },
            department: { select: { name: true } },
            entity: { select: { name: true } },
          },
        },
        events: {
          orderBy: { createdAt: "asc" },
          select: { type: true, actorId: true, payload: true, createdAt: true },
        },
      },
    }),
  ]);
  const hires = applications.filter((item) => item.status === "hired").length;
  // The applications of the last four weeks of the period, oldest first (recruteur lot 5, the
  // chart « Candidatures par semaine »).
  const weekly = [3, 2, 1, 0].map((back) => {
    const end = range.to.getTime() - back * 7 * DAY;
    return applications.filter((item) => {
      const at = item.createdAt.getTime();
      return at > end - 7 * DAY && at <= end;
    }).length;
  });
  const basic = { activeJobs, applications: applications.length, hires, interviews, weekly };
  if (rank < reportRank("stats"))
    return {
      level: reportsLevel,
      basic,
      stats: null,
      advanced: null,
      consolidated: null,
      custom: null,
    };

  // Funnel: an application counts in every stage it reached (current stage or a move through it).
  const reached = (application: (typeof applications)[number]) => {
    const kinds = new Set<string>(["new", application.stage.kind]);
    for (const event of application.events) {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      if (typeof payload.toKind === "string") kinds.add(payload.toKind);
    }
    const deepest = Math.max(
      ...[...kinds].map((kind) => funnelKinds.indexOf(kind as StageKind)).filter((i) => i >= 0),
    );
    return funnelKinds.slice(0, deepest + 1);
  };
  const funnel = funnelKinds.map((kind) => ({
    kind,
    count: applications.filter((application) => reached(application).includes(kind)).length,
  }));
  const conversion = funnel.map((step, index) => ({
    kind: step.kind,
    rate:
      index === 0 || funnel[index - 1]!.count === 0
        ? null
        : Math.round((step.count / funnel[index - 1]!.count) * 100),
  }));
  const timeToHire = average(
    applications.flatMap((application) => {
      const hired = application.events.find(
        (event) =>
          event.type === "decision" &&
          ((event.payload ?? {}) as Record<string, unknown>).toKind === "hired",
      );
      return hired ? [(hired.createdAt.getTime() - application.createdAt.getTime()) / DAY] : [];
    }),
  );
  const responseTime = average(
    applications.flatMap((application) => {
      const first = application.events.find(
        (event) =>
          event.actorId !== null &&
          ["viewed", "stage_changed", "decision", "message"].includes(event.type),
      );
      return first ? [(first.createdAt.getTime() - application.createdAt.getTime()) / DAY] : [];
    }),
  );
  const sources = (["direct", "invitation", "talent_search"] as const).map((source) => ({
    source,
    count: applications.filter((item) => item.source === source).length,
  }));
  const jobs = new Map<string, { title: string; applications: number; hires: number }>();
  for (const application of applications) {
    const row = jobs.get(application.jobId) ?? {
      title: application.job.title,
      applications: 0,
      hires: 0,
    };
    row.applications++;
    if (application.status === "hired") row.hires++;
    jobs.set(application.jobId, row);
  }
  const stats = {
    funnel,
    conversion,
    timeToHire: round1(timeToHire),
    responseTime: round1(responseTime),
    sources,
    byJob: [...jobs.values()].sort((a, b) => b.applications - a.applications),
  };
  if (rank < reportRank("advanced"))
    return { level: reportsLevel, basic, stats, advanced: null, consolidated: null, custom: null };

  const ids = applications.map((item) => item.id);
  const [members, scorecards] = await Promise.all([
    db.membership.findMany({
      where: { organizationId, status: { in: ["active", "removed", "suspended"] } },
      select: { userId: true, user: { select: { name: true } } },
    }),
    db.scorecard.findMany({
      where: { applicationId: { in: ids } },
      select: { recommendation: true, ratings: true },
    }),
  ]);
  const byRecruiter = members
    .map((member) => {
      const events = applications.flatMap((application) =>
        application.events.filter((event) => event.actorId === member.userId),
      );
      return {
        name: member.user.name,
        moves: events.filter((event) => event.type === "stage_changed").length,
        decisions: events.filter((event) => event.type === "decision").length,
        notes: events.filter((event) => event.type === "note").length,
      };
    })
    .filter((row) => row.moves + row.decisions + row.notes > 0)
    .sort((a, b) => b.decisions + b.moves - (a.decisions + a.moves));
  const ratings = scorecards.flatMap((card) =>
    Array.isArray(card.ratings)
      ? (card.ratings as { rating?: unknown }[])
          .map((item) => Number(item.rating))
          .filter((value) => value >= 1 && value <= 5)
      : [],
  );
  const decisions = applications.flatMap((application) =>
    application.events
      .filter(
        (event) =>
          event.type === "decision" &&
          ((event.payload ?? {}) as Record<string, unknown>).toKind === "rejected",
      )
      .map((event) => (event.payload ?? {}) as Record<string, unknown>),
  );
  const reasons = new Map<string, number>();
  for (const decision of decisions) {
    const reason = typeof decision.reason === "string" ? decision.reason : "other";
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }
  const advanced = {
    byRecruiter,
    scorecards: {
      count: scorecards.length,
      average: round1(average(ratings)),
      recommendations: (["strong_yes", "yes", "no", "strong_no"] as const).map((value) => ({
        value,
        count: scorecards.filter((card) => card.recommendation === value).length,
      })),
    },
    decisions: [...reasons.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    candidateExperience:
      decisions.length === 0
        ? null
        : Math.round(
            (decisions.filter((item) => item.messageSent === true).length / decisions.length) * 100,
          ),
  };
  if (rank < reportRank("consolidated"))
    return { level: reportsLevel, basic, stats, advanced, consolidated: null, custom: null };

  const groupBy = (key: (item: (typeof applications)[number]) => string | null | undefined) => {
    const groups = new Map<string, { name: string; applications: number; hires: number }>();
    for (const application of applications) {
      const name = key(application);
      if (!name) continue;
      const row = groups.get(name) ?? { name, applications: 0, hires: 0 };
      row.applications++;
      if (application.status === "hired") row.hires++;
      groups.set(name, row);
    }
    return [...groups.values()].sort((a, b) => b.applications - a.applications);
  };
  const consolidated = {
    byTeam: groupBy((item) => item.job.team?.name),
    byDepartment: groupBy((item) => item.job.department?.name),
  };
  if (rank < reportRank("custom"))
    return { level: reportsLevel, basic, stats, advanced, consolidated, custom: null };
  return {
    level: reportsLevel,
    basic,
    stats,
    advanced,
    consolidated,
    custom: { byEntity: groupBy((item) => item.job.entity?.name) },
  };
}
