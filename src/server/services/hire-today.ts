/**
 * « À traiter » (brief recruteur § 3, planche recruteur-1 r1 and r1plus): what asks for an action
 * today, never statistics for their own sake. New applications to examine, invitations without an
 * answer, evaluations to complete, unread messages; the next interviews; the active offers. When
 * nothing waits, the figures of the week and the next steps. Everything goes through `jobScope`
 * (golden rule n° 6).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { unreadCount } from "./connect";
import { scorecardsToComplete } from "./evaluation";
import { hirePermissions, jobScope, type HireContext } from "./hire";

const DAY = 86_400_000;

export async function hireToday(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const permissions = hirePermissions(ctx.role);
  const scope = await jobScope(db, ctx);
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const reads = permissions.readApplications;
  const [unseen, unseenCount, invitations, scorecards, unread, interviews, week] =
    await Promise.all([
      reads
        ? db.application.findMany({
            where: { job: scope, viewedAt: null, status: "active" },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: {
              id: true,
              createdAt: true,
              stage: { select: { name: true } },
              job: { select: { id: true, title: true } },
              profile: { select: { user: { select: { name: true, image: true } } } },
            },
          })
        : [],
      reads ? db.application.count({ where: { job: scope, viewedAt: null, status: "active" } }) : 0,
      db.interview.count({
        where: {
          organizationId: ctx.organizationId,
          application: { job: scope },
          status: { in: ["pending", "reschedule"] },
        },
      }),
      permissions.evaluate ? scorecardsToComplete(db, ctx) : 0,
      unreadCount(db, { userId: ctx.userId, hire: ctx }),
      db.interview.findMany({
        where: {
          organizationId: ctx.organizationId,
          application: { job: scope },
          OR: [
            { status: "confirmed", startsAt: { gte: now } },
            { status: { in: ["pending", "reschedule"] }, slots: { isEmpty: false } },
          ],
        },
        orderBy: [{ startsAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
        take: 6,
        select: {
          id: true,
          status: true,
          mode: true,
          startsAt: true,
          slots: true,
          timezone: true,
          application: {
            select: {
              id: true,
              job: { select: { title: true } },
              profile: { select: { user: { select: { name: true } } } },
            },
          },
        },
      }),
      Promise.all([
        db.application.count({ where: { job: scope, createdAt: { gte: weekAgo } } }),
        db.interview.count({
          where: {
            organizationId: ctx.organizationId,
            application: { job: scope },
            OR: [
              { status: "done", updatedAt: { gte: weekAgo } },
              { status: "confirmed", startsAt: { gte: weekAgo, lt: now } },
            ],
          },
        }),
        db.applicationEvent.count({
          where: {
            type: "decision",
            createdAt: { gte: weekAgo },
            application: { job: scope },
          },
        }),
      ]),
    ]);
  // An invitation still waiting shows its first slot to come; past ones are not « à venir ».
  const upcoming = interviews
    .map((interview) => ({
      ...interview,
      at:
        interview.startsAt ??
        interview.slots
          .filter((slot) => slot >= now)
          .sort((a, b) => a.getTime() - b.getTime())[0] ??
        null,
    }))
    .filter((interview) => interview.at)
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())
    .slice(0, 3);
  const nextConfirmed = upcoming.find((interview) => interview.status === "confirmed") ?? null;
  return {
    unseen,
    counts: { unseen: unseenCount, invitations, scorecards, unread },
    upcoming,
    nextConfirmed,
    week: { applications: week[0], interviews: week[1], decisions: week[2] },
    empty: unseenCount === 0 && invitations === 0 && upcoming.length === 0,
  };
}

export type HireToday = Awaited<ReturnType<typeof hireToday>>;
