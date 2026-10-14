/**
 * Structure of an organization (E8, partie 05 § 2.3 et § 5, partie 06 § 6.5): teams and
 * departments (`org.teams`), entities and subsidiaries (`org.entities`), the attribution of jobs
 * (`org.teams` for owner, team and department, `hire.collaboration` for the hiring team), team
 * scopes of members and the transfer of ownership. Every query is filtered by `organizationId`.
 */
import { z } from "zod";
import type { PrismaClient, TeamKind } from "@/generated/prisma/client";
import { can, level } from "@/server/entitlements";
import { getOrgJob, hirePermissions, HireError, type HireContext } from "./hire";

const orgSubject = (ctx: HireContext) => ({
  type: "organization" as const,
  id: ctx.organizationId,
});

function assertAdmin(ctx: HireContext) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
}

async function assertEntitled(db: PrismaClient, ctx: HireContext, key: string) {
  if (!(await can(db, orgSubject(ctx), key))) throw new HireError("forbidden");
}

export async function orgStructure(db: PrismaClient, organizationId: string) {
  const [teams, entities] = await Promise.all([
    db.team.findMany({
      where: { organizationId },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { memberships: { where: { status: "active" } }, jobs: true } },
        entity: { select: { name: true } },
      },
    }),
    db.orgEntity.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: { parent: { select: { name: true } } },
    }),
  ]);
  return {
    teams: teams.filter((team) => team.kind === "team"),
    departments: teams.filter((team) => team.kind === "department"),
    entities,
  };
}

// ─── Teams and departments ─────────────────────────────────────────────────────

const nameSchema = z.string().trim().min(2).max(80);

export async function createTeam(
  db: PrismaClient,
  ctx: HireContext,
  input: { name: string; kind: TeamKind; entityId?: string; leadId?: string },
) {
  assertAdmin(ctx);
  await assertEntitled(db, ctx, "org.teams");
  const name = nameSchema.safeParse(input.name);
  if (!name.success) throw new HireError("invalid");
  const entityId = input.entityId ? await ownEntity(db, ctx, input.entityId) : null;
  const leadId = input.leadId ? await activeMemberUser(db, ctx, input.leadId) : null;
  return db.team.create({
    data: {
      organizationId: ctx.organizationId,
      name: name.data,
      kind: input.kind,
      entityId,
      leadId,
    },
  });
}

export async function deleteTeam(db: PrismaClient, ctx: HireContext, teamId: string) {
  assertAdmin(ctx);
  const result = await db.team.deleteMany({
    where: { id: teamId, organizationId: ctx.organizationId },
  });
  if (result.count === 0) throw new HireError("notFound");
}

/** Puts a member in a team (or out of any team). The team scope applies at the « advanced » level. */
export async function setMemberTeam(
  db: PrismaClient,
  ctx: HireContext,
  membershipId: string,
  teamId: string | null,
) {
  assertAdmin(ctx);
  await assertEntitled(db, ctx, "org.teams");
  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.organizationId, status: "active" },
  });
  if (!membership) throw new HireError("notFound");
  if (teamId) await ownTeam(db, ctx, teamId, "team");
  await db.membership.update({ where: { id: membership.id }, data: { teamId } });
}

async function ownTeam(db: PrismaClient, ctx: HireContext, id: string, kind: TeamKind) {
  const team = await db.team.findFirst({
    where: { id, organizationId: ctx.organizationId, kind },
    select: { id: true },
  });
  if (!team) throw new HireError("notFound");
  return team.id;
}

async function ownEntity(db: PrismaClient, ctx: HireContext, id: string) {
  const entity = await db.orgEntity.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!entity) throw new HireError("notFound");
  return entity.id;
}

async function activeMemberUser(db: PrismaClient, ctx: HireContext, userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId, organizationId: ctx.organizationId, status: "active" },
    select: { userId: true },
  });
  if (!membership) throw new HireError("notFound");
  return membership.userId;
}

// ─── Entities ──────────────────────────────────────────────────────────────────

export async function createEntity(
  db: PrismaClient,
  ctx: HireContext,
  input: { name: string; country?: string; parentId?: string },
) {
  assertAdmin(ctx);
  await assertEntitled(db, ctx, "org.entities");
  const name = nameSchema.safeParse(input.name);
  if (!name.success) throw new HireError("invalid");
  const parentId = input.parentId ? await ownEntity(db, ctx, input.parentId) : null;
  return db.orgEntity.create({
    data: {
      organizationId: ctx.organizationId,
      name: name.data,
      country: input.country?.trim().slice(0, 80) || null,
      parentId,
    },
  });
}

/** An entity that still has jobs or teams must first see them reassigned (`org.entities.delete`). */
export async function deleteEntity(db: PrismaClient, ctx: HireContext, entityId: string) {
  assertAdmin(ctx);
  const entity = await db.orgEntity.findFirst({
    where: { id: entityId, organizationId: ctx.organizationId },
    include: { _count: { select: { jobs: true, teams: true, children: true } } },
  });
  if (!entity) throw new HireError("notFound");
  if (entity._count.jobs + entity._count.teams + entity._count.children > 0)
    throw new HireError("invalid");
  await db.orgEntity.delete({ where: { id: entity.id } });
}

// ─── Attribution of a job ───────────────────────────────────────────────────────

export const assignmentSchema = z.object({
  assignedToId: z.string().default(""),
  teamId: z.string().default(""),
  departmentId: z.string().default(""),
  entityId: z.string().default(""),
  memberIds: z.array(z.string()).max(30).default([]),
});

/**
 * Who is in charge of a job and who may see it. Each part is governed by its own entitlement:
 * owner, team and department by `org.teams`, entity by `org.entities`, hiring team by
 * `hire.collaboration`. A part the plan does not include is left as it was.
 */
export async function assignJob(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  raw: z.input<typeof assignmentSchema>,
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const input = assignmentSchema.parse(raw);
  const job = await getOrgJob(db, ctx, jobId);
  const subject = orgSubject(ctx);
  const [teams, entities, collaboration] = await Promise.all([
    can(db, subject, "org.teams"),
    can(db, subject, "org.entities"),
    can(db, subject, "hire.collaboration"),
  ]);
  const data: {
    assignedToId?: string | null;
    teamId?: string | null;
    departmentId?: string | null;
    entityId?: string | null;
  } = {};
  if (teams) {
    data.assignedToId = input.assignedToId
      ? await activeMemberUser(db, ctx, input.assignedToId)
      : null;
    data.teamId = input.teamId ? await ownTeam(db, ctx, input.teamId, "team") : null;
    data.departmentId = input.departmentId
      ? await ownTeam(db, ctx, input.departmentId, "department")
      : null;
  }
  if (entities) data.entityId = input.entityId ? await ownEntity(db, ctx, input.entityId) : null;
  await db.job.update({ where: { id: job.id }, data });
  if (collaboration) {
    const members = await db.membership.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: "active",
        userId: { in: [...new Set(input.memberIds)] },
      },
      select: { userId: true },
    });
    await db.$transaction([
      db.jobAssignment.deleteMany({ where: { jobId: job.id } }),
      db.jobAssignment.createMany({
        data: members.map((member) => ({ jobId: job.id, userId: member.userId })),
      }),
    ]);
  }
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "job.assign",
      targetType: "job",
      targetId: job.id,
      organizationId: ctx.organizationId,
      metadata: { ...data, members: input.memberIds.length },
    },
  });
}

// ─── Ownership ─────────────────────────────────────────────────────────────────

/** The owner hands the organization to another active member and becomes an administrator. */
export async function transferOwnership(db: PrismaClient, ctx: HireContext, membershipId: string) {
  if (ctx.role !== "org_owner") throw new HireError("forbidden");
  const target = await db.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.organizationId, status: "active" },
  });
  if (!target || target.userId === ctx.userId) throw new HireError("invalid");
  const permissions = await level(db, orgSubject(ctx), "org.permissions.level");
  // Below « standard » there is no administrator role: the former owner stays a recruiter.
  const formerRole = permissions === "basic" ? "recruiter" : "org_admin";
  await db.$transaction([
    db.membership.update({ where: { id: target.id }, data: { role: "org_owner" } }),
    db.membership.update({
      where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
      data: { role: formerRole },
    }),
    db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "org.transferOwnership",
        targetType: "organization",
        targetId: ctx.organizationId,
        organizationId: ctx.organizationId,
        metadata: { to: target.userId },
      },
    }),
  ]);
}
