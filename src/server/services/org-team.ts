/**
 * Équipe de l'entreprise (étape 3, A2, captures 076 à 078): the members with their role and their
 * rights, the tasks an administrator entrusts to them, the invitations, the join requests and the
 * people who say they work there. Every query is filtered by `organizationId` (golden rule n° 6).
 * Rights never name a plan: they stay within the role and within `org.permissions.level`.
 */
import { z } from "zod";
import type {
  MembershipRole,
  OrgTaskKind,
  OrgTaskStatus,
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";
import { level } from "@/server/entitlements";
import { hirePermissions, HireError, type HireContext } from "./hire";
import { notify } from "./notifications";
import { normalizeOrgName } from "./org-join";
import { grantableRoles } from "./organization";

// ─── Droits par membre ───────────────────────────────────────────────────────────

/** « Droits de … », in the order of the mockup. */
export const MEMBER_RIGHTS = [
  "publish",
  "sort",
  "interviews",
  "evaluate",
  "stats",
  "page",
] as const;
export type MemberRight = (typeof MEMBER_RIGHTS)[number];
export type MemberRights = Record<MemberRight, boolean>;

const all = (value: boolean) =>
  Object.fromEntries(MEMBER_RIGHTS.map((right) => [right, value])) as MemberRights;

/**
 * What a role may ever do (the code's rule, `hirePermissions`): a switch never goes beyond it.
 * A hiring manager sorts, interviews and evaluates the candidates of their offers but does not
 * publish; a viewer reads the dashboards.
 */
export function rightCeiling(role: MembershipRole): MemberRights {
  const permissions = hirePermissions(role);
  return {
    publish: permissions.manage,
    sort: permissions.readApplications,
    interviews: permissions.evaluate,
    evaluate: permissions.evaluate,
    stats: true,
    page: permissions.manage,
  };
}

/** The rights given with a role chosen in Équipe (the presets of the mockup). */
export function rolePreset(role: MembershipRole): MemberRights {
  if (role === "org_owner" || role === "org_admin") return all(true);
  if (role === "recruiter")
    return { ...all(true), stats: false, page: false } satisfies MemberRights;
  if (role === "hiring_manager")
    return { ...all(false), sort: true, interviews: true, evaluate: true };
  if (role === "viewer") return { ...all(false), stats: true };
  return all(false);
}

/** The rights in force: the switches (null = all the role allows), never beyond the role. */
export function effectiveRights(role: MembershipRole, stored: unknown): MemberRights {
  const ceiling = rightCeiling(role);
  if (role === "org_owner" || role === "org_admin") return ceiling;
  const saved =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Partial<Record<string, unknown>>)
      : null;
  return Object.fromEntries(
    MEMBER_RIGHTS.map((right) => [right, ceiling[right] && (saved ? saved[right] === true : true)]),
  ) as MemberRights;
}

/** Whether the member of `ctx` holds a right (administrators hold them all). */
export async function memberCan(db: PrismaClient, ctx: HireContext, right: MemberRight) {
  if (ctx.role === "org_owner" || ctx.role === "org_admin") return true;
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
    select: { rights: true, role: true },
  });
  if (!membership) return false;
  return effectiveRights(membership.role, membership.rights)[right];
}

function administer(ctx: HireContext) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
}

/** Another active member of the organization, never oneself nor an owner. */
async function otherMember(db: PrismaClient, ctx: HireContext, membershipId: string) {
  administer(ctx);
  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.organizationId, status: "active" },
  });
  if (!membership) throw new HireError("notFound");
  if (membership.userId === ctx.userId || membership.role === "org_owner")
    throw new HireError("forbidden");
  if (membership.role === "org_admin" && ctx.role !== "org_owner") throw new HireError("forbidden");
  return membership;
}

/**
 * A switch of « Droits de … ». Only with `org.permissions.level` « advanced »: below it, every
 * member keeps the rights of their role.
 */
export async function setMemberRight(
  db: PrismaClient,
  ctx: HireContext,
  membershipId: string,
  right: MemberRight,
  on: boolean,
): Promise<"ok" | "level" | "role"> {
  const membership = await otherMember(db, ctx, membershipId);
  const permissions = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "org.permissions.level",
  );
  if (permissions !== "advanced") return "level";
  if (on && !rightCeiling(membership.role)[right]) return "role";
  const rights = { ...effectiveRights(membership.role, membership.rights), [right]: on };
  await db.$transaction([
    db.membership.update({ where: { id: membership.id }, data: { rights } }),
    db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "org.member.right",
        targetType: "user",
        targetId: membership.userId,
        organizationId: ctx.organizationId,
        metadata: { right, on },
      },
    }),
  ]);
  return "ok";
}

/** « Rôle : … »: the role changes and the rights take its preset. */
export async function setMemberRole(
  db: PrismaClient,
  ctx: HireContext,
  membershipId: string,
  role: MembershipRole,
): Promise<"ok" | "role"> {
  const membership = await otherMember(db, ctx, membershipId);
  const permissions = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "org.permissions.level",
  );
  if (!grantableRoles(permissions).includes(role)) return "role";
  if (role === "org_admin" && ctx.role !== "org_owner") return "role";
  await db.$transaction([
    db.membership.update({
      where: { id: membership.id },
      data: { role, rights: rolePreset(role) },
    }),
    db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "org.member.role",
        targetType: "user",
        targetId: membership.userId,
        organizationId: ctx.organizationId,
        metadata: { role },
      },
    }),
  ]);
  return "ok";
}

/** « Retirer de l'équipe »: the seat is freed, nothing the member wrote is deleted. */
export async function removeTeamMember(db: PrismaClient, ctx: HireContext, membershipId: string) {
  const membership = await otherMember(db, ctx, membershipId);
  await db.$transaction([
    db.membership.update({ where: { id: membership.id }, data: { status: "removed" } }),
    db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "org.member.remove",
        targetType: "user",
        targetId: membership.userId,
        organizationId: ctx.organizationId,
      },
    }),
  ]);
}

// ─── Tâches ──────────────────────────────────────────────────────────────────────

export const TASK_KINDS = ["follow", "diagnostic", "interview"] as const satisfies OrgTaskKind[];
export const TASK_STEPS = [
  "assigned",
  "accepted",
  "in_progress",
  "done",
] as const satisfies OrgTaskStatus[];

const taskSchema = z.object({
  member: z.string().min(1).max(60),
  kind: z.enum(TASK_KINDS),
  application: z.string().min(1).max(60),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Members a task may go to: active, not oneself, not a viewer (who only reads). */
function assignable(role: MembershipRole) {
  return hirePermissions(role).evaluate;
}

export async function assignTask(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
  now = new Date(),
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: "invalid" | "due" }> {
  administer(ctx);
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { member, kind, application, due } = parsed.data;
  const dueAt = new Date(`${due}T17:00:00.000Z`);
  if (Number.isNaN(dueAt.getTime())) return { ok: false, error: "invalid" };
  if (dueAt.getTime() < now.getTime() - 86_400_000) return { ok: false, error: "due" };
  const [membership, found] = await Promise.all([
    db.membership.findFirst({
      where: { userId: member, organizationId: ctx.organizationId, status: "active" },
      select: { userId: true, role: true, user: { select: { name: true } } },
    }),
    db.application.findFirst({
      where: { id: application, job: { organizationId: ctx.organizationId } },
      select: { id: true, job: { select: { title: true } } },
    }),
  ]);
  if (!membership || !found || !assignable(membership.role) || membership.userId === ctx.userId)
    return { ok: false, error: "invalid" };
  const task = await db.orgTask.create({
    data: {
      organizationId: ctx.organizationId,
      assigneeId: membership.userId,
      assignedById: ctx.userId,
      kind,
      applicationId: found.id,
      dueAt,
    },
    select: {
      id: true,
      application: { select: { profile: { select: { user: { select: { name: true } } } } } },
    },
  });
  await notify(db, {
    userIds: [membership.userId],
    type: "orgTaskAssigned",
    payload: { kind, candidate: task.application.profile.user.name },
    href: "/app/hire/taches",
  });
  return { ok: true, id: task.id, name: membership.user.name };
}

async function orgTask(db: PrismaClient, ctx: HireContext, taskId: string) {
  const task = await db.orgTask.findFirst({
    where: { id: taskId, organizationId: ctx.organizationId },
    select: {
      id: true,
      kind: true,
      status: true,
      assigneeId: true,
      assignedById: true,
      assignee: { select: { name: true } },
      application: { select: { profile: { select: { user: { select: { name: true } } } } } },
    },
  });
  if (!task) throw new HireError("notFound");
  return task;
}

/** « Relancer »: the member gets a reminder; nothing changes in the task. */
export async function remindTask(db: PrismaClient, ctx: HireContext, taskId: string) {
  administer(ctx);
  const task = await orgTask(db, ctx, taskId);
  if (task.status === "done") throw new HireError("invalid");
  await db.orgTask.update({ where: { id: task.id }, data: { remindedAt: new Date() } });
  await notify(db, {
    userIds: [task.assigneeId],
    type: "orgTaskReminder",
    payload: { kind: task.kind, candidate: task.application.profile.user.name },
    href: "/app/hire/taches",
  });
  return task.assignee.name;
}

/** The member moves their task one step on: Acceptée, En cours, then Terminée. */
export async function advanceTask(
  db: PrismaClient,
  ctx: HireContext,
  taskId: string,
  now = new Date(),
): Promise<OrgTaskStatus> {
  const task = await orgTask(db, ctx, taskId);
  if (task.assigneeId !== ctx.userId) throw new HireError("forbidden");
  const index = TASK_STEPS.indexOf(task.status);
  if (index >= TASK_STEPS.length - 1) throw new HireError("invalid");
  const status = TASK_STEPS[index + 1]!;
  await db.orgTask.update({
    where: { id: task.id },
    data: { status, doneAt: status === "done" ? now : null },
  });
  if (status === "done" && task.assignedById) {
    await notify(db, {
      userIds: [task.assignedById],
      type: "orgTaskDone",
      payload: {
        kind: task.kind,
        candidate: task.application.profile.user.name,
        name: task.assignee.name,
      },
      href: "/app/organisation/equipe?onglet=taches",
    });
  }
  return status;
}

const taskSelect = {
  id: true,
  kind: true,
  status: true,
  dueAt: true,
  assigneeId: true,
  applicationId: true,
  assignee: { select: { name: true } },
  application: { select: { profile: { select: { user: { select: { name: true } } } } } },
} satisfies Prisma.OrgTaskSelect;

export type TeamTask = {
  id: string;
  kind: OrgTaskKind;
  status: OrgTaskStatus;
  dueAt: Date;
  late: boolean;
  assigneeId: string;
  assigneeName: string;
  applicationId: string;
  candidate: string;
};

function toTask(
  task: Prisma.OrgTaskGetPayload<{ select: typeof taskSelect }>,
  now: Date,
): TeamTask {
  return {
    id: task.id,
    kind: task.kind,
    status: task.status,
    dueAt: task.dueAt,
    late: task.status !== "done" && task.dueAt.getTime() < now.getTime(),
    assigneeId: task.assigneeId,
    assigneeName: task.assignee.name,
    applicationId: task.applicationId,
    candidate: task.application.profile.user.name,
  };
}

/** « Mes tâches »: what the member was entrusted with, unfinished first. */
export async function myTasks(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const tasks = await db.orgTask.findMany({
    where: { organizationId: ctx.organizationId, assigneeId: ctx.userId },
    orderBy: [{ dueAt: "asc" }],
    take: 100,
    select: taskSelect,
  });
  return tasks
    .map((task) => toTask(task, now))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
}

// ─── Membres déclarés ───────────────────────────────────────────────────────────

/**
 * People whose current experience names the organization, who let recruiters see their profile,
 * who are not members yet. With their answer when an administrator gave one.
 */
async function declaredCandidates(db: PrismaClient, organizationId: string) {
  const org = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true },
  });
  const name = normalizeOrgName(org.name);
  const word =
    org.name
      .split(/[\s-]+/)
      .find((part) => part.length >= 3)
      ?.trim() ?? org.name.trim();
  if (!name || !word) return [];
  const experiences = await db.experience.findMany({
    where: {
      endDate: null,
      company: { contains: word, mode: "insensitive" },
      profile: {
        visibility: { not: "private" },
        user: {
          memberships: { none: { organizationId, status: "active" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      title: true,
      company: true,
      profile: { select: { user: { select: { id: true, name: true } } } },
      declaredAt: {
        where: { organizationId },
        select: { status: true },
      },
    },
  });
  return experiences
    .filter((experience) => normalizeOrgName(experience.company) === name)
    .map((experience) => ({
      experienceId: experience.id,
      userId: experience.profile.user.id,
      name: experience.profile.user.name,
      title: experience.title,
      status: experience.declaredAt[0]?.status ?? null,
    }));
}

/** « Demandes à valider »: the declarations nobody answered yet. */
export async function pendingDeclaredMembers(db: PrismaClient, ctx: HireContext) {
  administer(ctx);
  return (await declaredCandidates(db, ctx.organizationId)).filter((item) => !item.status);
}

/**
 * The people the company page shows as working there: confirmed, or « Indiqué par la personne »
 * while nobody answered. « Ne travaille pas ici » removes them.
 */
export async function declaredMembers(db: PrismaClient, organizationId: string) {
  return (await declaredCandidates(db, organizationId)).filter(
    (item) => item.status !== "rejected",
  );
}

/** « Confirmer » or « Ne travaille pas ici ». */
export async function respondDeclaredMember(
  db: PrismaClient,
  ctx: HireContext,
  experienceId: string,
  confirm: boolean,
) {
  administer(ctx);
  const found = (await declaredCandidates(db, ctx.organizationId)).find(
    (item) => item.experienceId === experienceId,
  );
  if (!found) throw new HireError("notFound");
  const status = confirm ? "confirmed" : "rejected";
  await db.orgDeclaredMember.upsert({
    where: { organizationId_experienceId: { organizationId: ctx.organizationId, experienceId } },
    update: { status, respondedById: ctx.userId, respondedAt: new Date() },
    create: {
      organizationId: ctx.organizationId,
      experienceId,
      status,
      respondedById: ctx.userId,
    },
  });
  return found.name;
}

// ─── L'écran Équipe ───────────────────────────────────────────────────────────────

/** Everything the three tabs of Équipe show, for an administrator. */
export async function teamScreen(db: PrismaClient, ctx: HireContext, now = new Date()) {
  administer(ctx);
  const [members, tasks, invitations, permissions, applications] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        role: true,
        rights: true,
        jobTitle: true,
        user: { select: { name: true, image: true } },
      },
    }),
    db.orgTask.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: [{ dueAt: "asc" }],
      take: 200,
      select: taskSelect,
    }),
    db.invitation.findMany({
      where: {
        organizationId: ctx.organizationId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, createdAt: true },
    }),
    level(db, { type: "organization", id: ctx.organizationId }, "org.permissions.level"),
    // « Pour quel candidat » of « Attribuer une tâche »: the applications in progress.
    db.application.findMany({
      where: { job: { organizationId: ctx.organizationId }, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        job: { select: { title: true } },
        profile: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);
  return {
    permissions,
    advanced: permissions === "advanced",
    roles: grantableRoles(permissions).filter(
      (role) => role !== "org_admin" || ctx.role === "org_owner",
    ),
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user.name,
      image: member.user.image,
      role: member.role,
      jobTitle: member.jobTitle,
      me: member.userId === ctx.userId,
      rights: effectiveRights(member.role, member.rights),
      ceiling: rightCeiling(member.role),
      editable:
        member.userId !== ctx.userId &&
        member.role !== "org_owner" &&
        (member.role !== "org_admin" || ctx.role === "org_owner"),
      assignable: member.userId !== ctx.userId && assignable(member.role),
    })),
    tasks: tasks.map((task) => toTask(task, now)),
    invitations,
    // « Échéance » of « Attribuer une tâche »: in 3, 5 and 7 days.
    dues: [3, 5, 7].map((days) =>
      new Date(now.getTime() + days * 86_400_000).toISOString().slice(0, 10),
    ),
    applications: applications.map((application) => ({
      id: application.id,
      name: application.profile.user.name,
      job: application.job.title,
    })),
  };
}
