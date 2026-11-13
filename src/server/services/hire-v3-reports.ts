/**
 * « Rapports » of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, `V.rapports`):
 * over 7 days, 30 days or a quarter, the applications against the period before, the hires, the
 * delay to a first interview, the passage to interview, the applications and screenings in time,
 * the sources, the funnel, the team's activity and the offers. Real figures only, scoped to the
 * offers the member can see.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { HireError, hirePermissions, jobScope, type HireContext } from "./hire";

const DAY = 86_400_000;
export const REPORT_PERIODS = { "7": 7, "30": 30, "90": 90 } as const;
export type ReportPeriodKey = keyof typeof REPORT_PERIODS;
const BUCKET = { 7: 1, 30: 6, 90: 15 } as const;
const AFTER_SCREENING = ["screening", "test", "interview", "offer", "hired"];

const dayStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export async function reportsV3(
  db: PrismaClient,
  ctx: HireContext,
  days: 7 | 30 | 90,
  now = new Date(),
) {
  const perms = hirePermissions(ctx.role);
  if (!perms.manage && ctx.role !== "viewer" && !perms.readApplications)
    throw new HireError("forbidden");
  const scope = await jobScope(db, ctx);
  const end = new Date(dayStart(now).getTime() + DAY);
  const start = new Date(end.getTime() - days * DAY);
  const before = new Date(start.getTime() - days * DAY);
  const [apps, interviews, events, jobs] = await Promise.all([
    db.application.findMany({
      where: { job: scope, createdAt: { gte: before, lt: end } },
      select: {
        id: true,
        jobId: true,
        createdAt: true,
        source: true,
        status: true,
        matchScore: true,
        stage: { select: { kind: true } },
      },
    }),
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        application: { job: scope },
        status: { in: ["confirmed", "done"] },
        startsAt: { gte: before, lt: end },
      },
      select: { startsAt: true, applicationId: true, application: { select: { createdAt: true } } },
    }),
    db.applicationEvent.findMany({
      where: {
        createdAt: { gte: before, lt: end },
        application: { job: scope },
        OR: [{ type: "decision" }, { actorId: { not: null } }],
      },
      select: { type: true, actorId: true, payload: true, createdAt: true },
    }),
    db.job.findMany({
      where: { AND: [scope, { status: { in: ["published", "paused", "closed"] } }] },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, status: true },
    }),
  ]);
  const inNow = <T extends { createdAt: Date }>(rows: T[]) =>
    rows.filter((r) => r.createdAt >= start);
  const inBefore = <T extends { createdAt: Date }>(rows: T[]) =>
    rows.filter((r) => r.createdAt < start);
  const hiredIn = (rows: typeof events) =>
    rows.filter(
      (e) =>
        e.type === "decision" && ((e.payload ?? {}) as Record<string, unknown>).toKind === "hired",
    ).length;
  const appsNow = inNow(apps);
  const appsBefore = inBefore(apps);
  const delayOf = (from: Date, to: Date) => {
    const firsts = new Map<string, number>();
    for (const i of interviews) {
      if (!i.startsAt || i.startsAt < from || i.startsAt >= to) continue;
      const d = (i.startsAt.getTime() - i.application.createdAt.getTime()) / DAY;
      if (d >= 0 && (!firsts.has(i.applicationId) || d < firsts.get(i.applicationId)!))
        firsts.set(i.applicationId, d);
    }
    const v = [...firsts.values()];
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  const screened = (rows: typeof apps) =>
    rows.filter((a) => AFTER_SCREENING.includes(a.stage.kind)).length;
  const interviewed = (rows: typeof apps) =>
    rows.filter((a) => ["interview", "offer", "hired"].includes(a.stage.kind)).length;
  const pass = (rows: typeof apps) => {
    const s = screened(rows);
    return s ? Math.round((interviewed(rows) / s) * 100) : null;
  };
  const step = BUCKET[days];
  const buckets = Array.from({ length: Math.ceil(days / step) }, (_, i) => {
    const from = new Date(start.getTime() + i * step * DAY);
    const to = new Date(Math.min(end.getTime(), from.getTime() + step * DAY));
    const rows = appsNow.filter((a) => a.createdAt >= from && a.createdAt < to);
    return { from, applications: rows.length, screened: screened(rows) };
  });
  const reached = (kinds: string[]) => appsNow.filter((a) => kinds.includes(a.stage.kind)).length;
  const funnel = [
    { key: "received", count: appsNow.length },
    { key: "screening", count: reached(AFTER_SCREENING) },
    { key: "test", count: reached(["test", "interview", "offer", "hired"]) },
    { key: "interview", count: reached(["interview", "offer", "hired"]) },
    { key: "offer", count: reached(["offer", "hired"]) },
  ];
  // The team: actions on the applications in the period, by member.
  const actors = new Map<string, number>();
  for (const e of inNow(events))
    if (e.actorId) actors.set(e.actorId, (actors.get(e.actorId) ?? 0) + 1);
  const members = await db.membership.findMany({
    where: { organizationId: ctx.organizationId, status: "active" },
    select: { role: true, user: { select: { id: true, name: true } } },
  });
  return {
    days,
    start,
    applications: { total: appsNow.length, before: appsBefore.length },
    hires: { total: hiredIn(inNow(events)), before: hiredIn(inBefore(events)) },
    delay: { total: delayOf(start, end), before: delayOf(before, start) },
    pass: { total: pass(appsNow), before: pass(appsBefore) },
    screened: screened(appsNow),
    buckets,
    sources: (["direct", "invitation", "talent_search"] as const).map((source) => ({
      source,
      count: appsNow.filter((a) => a.source === source).length,
    })),
    funnel,
    team: members
      .map((m) => ({
        id: m.user.id,
        name: m.user.name,
        role: m.role,
        actions: actors.get(m.user.id) ?? 0,
      }))
      .sort((a, b) => b.actions - a.actions),
    offers: jobs
      .map((job) => {
        const rows = appsNow.filter((a) => a.jobId === job.id);
        return {
          id: job.id,
          title: job.title,
          status: job.status,
          applications: rows.length,
          high: rows.filter((a) => (a.matchScore ?? 0) >= 75).length,
        };
      })
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 6),
  };
}

export type ReportsV3 = Awaited<ReturnType<typeof reportsV3>>;
