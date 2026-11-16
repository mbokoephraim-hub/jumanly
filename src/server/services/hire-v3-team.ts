/**
 * « Équipe » of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, `V.equipe`):
 * the members with the places of the plan, each member's load this week (interviews, follow-ups,
 * diagnostics, interview tasks), who is in charge of which offer, and the consultation log
 * (every profile opened, golden rule n° 5). Real data only, scoped to the organization.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { HireError, hirePermissions, type HireContext } from "./hire";
import { listMembers, seatUsage } from "./organization";
import { effectiveRights } from "./org-team";

const DAY = 86_400_000;
export const TEAM_LOAD = ["interviews", "follow", "diagnostic", "interview"] as const;

export async function teamV3(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const weekday = (now.getUTCDay() + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - weekday),
  );
  const sunday = new Date(monday.getTime() + 7 * DAY);
  const [{ members, invitations }, seats, tasks, interviews, jobs] = await Promise.all([
    listMembers(db, ctx, now),
    seatUsage(db, ctx.organizationId, now),
    db.orgTask.findMany({
      where: { organizationId: ctx.organizationId, status: { not: "done" } },
      select: { assigneeId: true, kind: true, dueAt: true },
    }),
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: { in: ["confirmed", "done"] },
        startsAt: { gte: monday, lt: sunday },
      },
      select: { participantIds: true },
    }),
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: { in: ["published", "paused"] } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { id: true, title: true, assignedToId: true, createdById: true },
    }),
  ]);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const rows = members.map((m) => {
    const mine = tasks.filter((t) => t.assigneeId === m.userId);
    const load = {
      interviews: interviews.filter((i) => i.participantIds.includes(m.userId)).length,
      follow: mine.filter((t) => t.kind === "follow").length,
      diagnostic: mine.filter((t) => t.kind === "diagnostic").length,
      interview: mine.filter((t) => t.kind === "interview").length,
    };
    return {
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      role: m.role,
      team: m.team?.name ?? null,
      me: m.userId === ctx.userId,
      load,
      total: Object.values(load).reduce((a, b) => a + b, 0),
    };
  });
  return {
    seats,
    members: rows,
    invitations: invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      createdAt: i.createdAt,
    })),
    openTasks: tasks.length,
    dueToday: tasks.filter((t) => t.dueAt < today).length,
    interviews: interviews.length,
    jobs: jobs.map((j) => ({ id: j.id, title: j.title, owner: j.assignedToId ?? j.createdById })),
    monday,
  };
}

export async function consultationLog(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const since = new Date(now.getTime() - 30 * DAY);
  const logs = await db.auditLog.findMany({
    where: {
      organizationId: ctx.organizationId,
      action: "profile.view",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, actorId: true, targetId: true, createdAt: true, metadata: true },
  });
  const ids = (key: "actorId" | "targetId") => [
    ...new Set(logs.map((l) => l[key]).filter((v): v is string => !!v)),
  ];
  const [actors, profiles] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids("actorId") } }, select: { id: true, name: true } }),
    db.talentProfile.findMany({
      where: { id: { in: ids("targetId") } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekStart = new Date(now.getTime() - 7 * DAY);
  return {
    today: logs.filter((l) => l.createdAt >= dayStart).length,
    week: logs.filter((l) => l.createdAt >= weekStart).length,
    members: new Set(logs.filter((l) => l.createdAt >= weekStart).map((l) => l.actorId)).size,
    profiles: new Set(logs.map((l) => l.targetId)).size,
    rows: logs.slice(0, 40).map((l) => ({
      id: l.id,
      actor: actors.find((a) => a.id === l.actorId)?.name ?? null,
      profile: profiles.find((p) => p.id === l.targetId)?.user.name ?? null,
      applicationId:
        typeof (l.metadata as Record<string, unknown> | null)?.applicationId === "string"
          ? ((l.metadata as Record<string, unknown>).applicationId as string)
          : null,
      at: l.createdAt,
    })),
  };
}

/** Audit actions the member file names (`hireV3Member.actions.*`); the others read « Action notée ». */
export const MEMBER_ACTIONS = [
  "job.publish",
  "job.update",
  "job.pause",
  "job.resume",
  "job.close",
  "job.assign",
  "job.schedule",
  "profile.view",
  "scorecard.save",
  "hire.group_reply",
  "talent.search",
  "org.invite",
] as const;

/**
 * « Fiche membre » of Équipe (Hire v3, lot 6, `V.membre`): the week's load, the tasks by status,
 * what the member did (the audit log, in the organization only) and the rights of the role. An
 * administrator opens every file; a member opens their own.
 */
export async function memberFile(
  db: PrismaClient,
  ctx: HireContext,
  membershipId: string,
  now = new Date(),
) {
  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.organizationId, status: "active" },
    select: {
      id: true,
      userId: true,
      role: true,
      jobTitle: true,
      rights: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });
  if (!membership) throw new HireError("notFound");
  const admin = hirePermissions(ctx.role).administer;
  if (!admin && membership.userId !== ctx.userId) throw new HireError("forbidden");
  const since = new Date(now.getTime() - 14 * DAY);
  const [team, tasks, logs, jobs] = await Promise.all([
    teamV3(db, ctx, now),
    db.orgTask.findMany({
      where: {
        organizationId: ctx.organizationId,
        assigneeId: membership.userId,
        OR: [{ status: { not: "done" } }, { doneAt: { gte: since } }],
      },
      orderBy: { dueAt: "asc" },
      take: 40,
      select: {
        id: true,
        kind: true,
        status: true,
        dueAt: true,
        application: {
          select: {
            id: true,
            job: { select: { title: true } },
            profile: { select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    db.auditLog.findMany({
      where: {
        organizationId: ctx.organizationId,
        actorId: membership.userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, action: true, targetType: true, targetId: true, createdAt: true },
    }),
    db.job.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: { in: ["published", "paused"] },
        OR: [
          { assignedToId: membership.userId },
          { assignedToId: null, createdById: membership.userId },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: { id: true, title: true },
    }),
  ]);
  const jobIds = logs.filter((l) => l.targetType === "job").map((l) => l.targetId);
  const titles = jobIds.length
    ? await db.job.findMany({
        where: { id: { in: jobIds }, organizationId: ctx.organizationId },
        select: { id: true, title: true },
      })
    : [];
  const row = team.members.find((m) => m.id === membership.id);
  const known = new Set<string>(MEMBER_ACTIONS);
  return {
    id: membership.id,
    name: membership.user.name,
    role: membership.role,
    title: membership.jobTitle?.trim() || null,
    since: membership.createdAt,
    me: membership.userId === ctx.userId,
    canAdminister: admin,
    load: row?.load ?? { interviews: 0, follow: 0, diagnostic: 0, interview: 0 },
    total: row?.total ?? 0,
    openTasks: tasks.filter((t) => t.status !== "done").length,
    doneTasks: tasks.filter((t) => t.status === "done").length,
    tasks: tasks.map((t) => ({
      id: t.id,
      kind: t.kind,
      status: t.status,
      dueAt: t.dueAt,
      applicationId: t.application.id,
      candidate: t.application.profile.user.name,
      job: t.application.job.title,
    })),
    activity: logs.map((l) => ({
      id: l.id,
      action: known.has(l.action) ? l.action.replace(".", "_") : "other",
      job: titles.find((j) => j.id === l.targetId)?.title ?? null,
      at: l.createdAt,
    })),
    rights: effectiveRights(membership.role, membership.rights),
    jobs,
  };
}

export type MemberFile = Awaited<ReturnType<typeof memberFile>>;
