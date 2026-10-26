/**
 * The recruiter's home on a computer (Modèle B, lot N1, captures 032 and 075): the day's
 * appointments, what waits for an action, the member's tasks, the offers and, for an
 * administrator, the team, the requests to validate and the month in figures. Every read goes
 * through `jobScope` or `organizationId` (golden rule n° 6); the figures are the real ones.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { resolvePlan } from "@/server/entitlements";
import { unreadCount } from "./connect";
import { hirePermissions, jobScope, type HireContext } from "./hire";
import { buildReport } from "./hire-reports";
import { hireToday } from "./hire-today";
import { listOffers } from "./hire-offers";
import { pendingJoinRequests } from "./org-join";
import { myTasks, pendingDeclaredMembers } from "./org-team";
import { seatUsage } from "./organization";

const DAY = 86_400_000;

/** Midnight UTC of the day, and of the next one. */
export function dayBounds(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { start, end: new Date(start.getTime() + DAY) };
}

/**
 * The badges of the sidebar: new applications, the day's appointments, the talents who answered
 * a proposal in the last seven days, the unread conversations.
 */
export async function recruiterWebCounts(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const scope = await jobScope(db, ctx);
  const { start, end } = dayBounds(now);
  const reads = hirePermissions(ctx.role).readApplications;
  const [applications, interviews, talents, messages] = await Promise.all([
    reads ? db.application.count({ where: { job: scope, viewedAt: null, status: "active" } }) : 0,
    db.interview.count({
      where: {
        organizationId: ctx.organizationId,
        application: { job: scope },
        status: "confirmed",
        startsAt: { gte: start, lt: end },
      },
    }),
    db.contactRequest.count({
      where: {
        organizationId: ctx.organizationId,
        requesterId: ctx.userId,
        status: "accepted",
        respondedAt: { gte: new Date(now.getTime() - 7 * DAY) },
      },
    }),
    unreadCount(db, { userId: ctx.userId, hire: ctx }),
  ]);
  return { applications, interviews, talents, messages };
}

export type RecruiterWebCounts = Awaited<ReturnType<typeof recruiterWebCounts>>;

/** The day's confirmed appointments, earliest first. */
async function interviewsOfDay(db: PrismaClient, ctx: HireContext, now: Date) {
  const scope = await jobScope(db, ctx);
  const { start, end } = dayBounds(now);
  return db.interview.findMany({
    where: {
      organizationId: ctx.organizationId,
      application: { job: scope },
      status: "confirmed",
      startsAt: { gte: start, lt: end },
    },
    orderBy: { startsAt: "asc" },
    take: 6,
    select: {
      id: true,
      mode: true,
      startsAt: true,
      application: {
        select: {
          id: true,
          job: { select: { title: true } },
          profile: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
}

/** The best unseen application, for « Orbi résume » (a fact, never a judgment). */
async function bestUnseen(db: PrismaClient, ctx: HireContext) {
  if (!hirePermissions(ctx.role).readApplications) return null;
  const scope = await jobScope(db, ctx);
  return db.application.findFirst({
    where: { job: scope, viewedAt: null, status: "active", matchScore: { not: null } },
    orderBy: [{ matchScore: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      matchScore: true,
      profile: { select: { user: { select: { name: true } } } },
    },
  });
}

export async function webHome(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const [today, interviews, tasks, offers, best] = await Promise.all([
    hireToday(db, ctx, now),
    interviewsOfDay(db, ctx, now),
    myTasks(db, ctx, now),
    listOffers(db, ctx, now),
    bestUnseen(db, ctx),
  ]);
  return {
    today,
    interviews,
    tasks: tasks.filter((task) => task.status !== "done"),
    offers: offers.filter((offer) => offer.status !== "closed").slice(0, 5),
    best,
  };
}

export type WebHome = Awaited<ReturnType<typeof webHome>>;

/** The part of the home only an administrator sees (capture 075). */
export async function webHomeAdmin(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [seats, joins, declared, teamTasks, late, doneThisMonth, plan, report] = await Promise.all([
    seatUsage(db, ctx.organizationId, now),
    pendingJoinRequests(db, ctx),
    pendingDeclaredMembers(db, ctx),
    db.orgTask.findMany({
      where: { organizationId: ctx.organizationId, status: { not: "done" } },
      orderBy: { dueAt: "asc" },
      take: 5,
      select: {
        id: true,
        kind: true,
        status: true,
        dueAt: true,
        assignee: { select: { name: true } },
        application: { select: { profile: { select: { user: { select: { name: true } } } } } },
      },
    }),
    db.orgTask.count({
      where: { organizationId: ctx.organizationId, status: { not: "done" }, dueAt: { lt: now } },
    }),
    db.orgTask.count({
      where: {
        organizationId: ctx.organizationId,
        status: "done",
        updatedAt: { gte: monthStart },
      },
    }),
    resolvePlan(db, subject, now),
    buildReport(db, ctx, { from: monthStart, to: now }),
  ]);
  const subscription = plan?.subscriptionId
    ? await db.subscription.findFirst({
        where: {
          id: plan.subscriptionId,
          subjectType: "organization",
          subjectId: ctx.organizationId,
        },
        select: { currentPeriodEnd: true },
      })
    : null;
  const paid = (plan?.priceCents ?? 0) > 0;
  return {
    seats,
    requests: {
      joins: joins?.requests ?? [],
      declared,
      count: (joins?.requests.length ?? 0) + declared.length,
    },
    teamTasks: teamTasks.map((task) => ({
      id: task.id,
      kind: task.kind,
      status: task.status,
      dueAt: task.dueAt,
      late: task.dueAt.getTime() < now.getTime(),
      assignee: task.assignee.name,
      candidate: task.application.profile.user.name,
    })),
    late,
    doneThisMonth,
    renewal: paid ? (subscription?.currentPeriodEnd ?? null) : null,
    month: {
      start: monthStart,
      applications: report.basic.applications,
      interviews: report.basic.interviews,
      hires: report.basic.hires,
      responseDays: report.stats?.responseTime ?? null,
    },
  };
}

export type WebHomeAdmin = Awaited<ReturnType<typeof webHomeAdmin>>;
