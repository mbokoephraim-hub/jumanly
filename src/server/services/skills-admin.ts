/**
 * Matching tools of the admin (27/10/2026): the skills referential. The score compares a job's
 * skills with a profile's by name and synonyms (partie 08), so two spellings of one skill
 * (« Excel », « MS Excel », a skill a person typed) only match once they are linked. Here the
 * team adds synonyms and merges a skill into another. Only counts are shown, never who holds a
 * skill. Every change is recorded in the journal.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { CUSTOM_SKILL_CATEGORY } from "./profile";

export class SkillAdminError extends Error {
  constructor(readonly code: "notFound" | "same" | "alias") {
    super(code);
    this.name = "SkillAdminError";
  }
}

const fold = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

export type SkillFilter = "custom" | "all";

/** Skills with how many profiles, offers and courses use them; the most used first. */
export async function skillsOverview(
  db: PrismaClient,
  { filter, q, take = 60 }: { filter: SkillFilter; q: string; take?: number },
) {
  const where: Prisma.SkillWhereInput = {
    ...(filter === "custom" ? { category: CUSTOM_SKILL_CATEGORY } : {}),
    ...(q
      ? {
          OR: [{ name: { contains: q, mode: "insensitive" } }, { aliases: { has: q } }],
        }
      : {}),
  };
  const [rows, total, custom] = await Promise.all([
    db.skill.findMany({
      where,
      select: {
        id: true,
        name: true,
        aliases: true,
        category: true,
        _count: { select: { profiles: true, jobs: true, courses: true } },
      },
      orderBy: [{ profiles: { _count: "desc" } }, { name: "asc" }],
      take,
    }),
    db.skill.count({ where }),
    db.skill.count({ where: { category: CUSTOM_SKILL_CATEGORY } }),
  ]);
  return { rows, total, custom };
}

/** Skills of the referential a custom skill may join (names for the picker). */
export async function referentialNames(db: PrismaClient) {
  const rows = await db.skill.findMany({
    where: { category: { not: CUSTOM_SKILL_CATEGORY } },
    select: { name: true },
    orderBy: { name: "asc" },
    take: 2000,
  });
  return rows.map((row) => row.name);
}

const reason = z.string().trim().min(3).max(500);

export const aliasSchema = z.object({
  skillId: z.string().min(1),
  alias: z.string().trim().min(2).max(80),
  reason,
});

/** « Ajouter un synonyme »: the score then matches this spelling too. */
export async function addSkillAlias(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof aliasSchema>,
) {
  const skill = await db.skill.findUnique({ where: { id: input.skillId } });
  if (!skill) throw new SkillAdminError("notFound");
  const known = [skill.name, ...skill.aliases].map(fold);
  if (known.includes(fold(input.alias))) throw new SkillAdminError("alias");
  await db.$transaction([
    db.skill.update({
      where: { id: skill.id },
      data: { aliases: [...skill.aliases, input.alias] },
    }),
    db.auditLog.create({
      data: {
        actorId,
        action: "skill.alias.add",
        targetType: "skill",
        targetId: skill.id,
        metadata: { skill: skill.name, alias: input.alias, reason: input.reason },
      },
    }),
  ]);
}

export const removeAliasSchema = z.object({
  skillId: z.string().min(1),
  alias: z.string().min(1).max(80),
});

export async function removeSkillAlias(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof removeAliasSchema>,
) {
  const skill = await db.skill.findUnique({ where: { id: input.skillId } });
  if (!skill) throw new SkillAdminError("notFound");
  await db.$transaction([
    db.skill.update({
      where: { id: skill.id },
      data: { aliases: skill.aliases.filter((alias) => alias !== input.alias) },
    }),
    db.auditLog.create({
      data: {
        actorId,
        action: "skill.alias.remove",
        targetType: "skill",
        targetId: skill.id,
        metadata: { skill: skill.name, alias: input.alias },
      },
    }),
  ]);
}

export const mergeSchema = z.object({
  skillId: z.string().min(1),
  target: z.string().trim().min(2).max(80),
  reason,
});

/**
 * « Fusionner dans… »: every profile, offer and course holding the skill now holds the target
 * (a profile that already had both keeps its own level on the target), the old name becomes a
 * synonym of the target and the old skill is deleted.
 */
export async function mergeSkill(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof mergeSchema>,
) {
  const [source, target] = await Promise.all([
    db.skill.findUnique({ where: { id: input.skillId } }),
    db.skill.findFirst({ where: { name: { equals: input.target, mode: "insensitive" } } }),
  ]);
  if (!source || !target) throw new SkillAdminError("notFound");
  if (source.id === target.id) throw new SkillAdminError("same");
  const [profiles, jobs, courses] = await Promise.all([
    db.profileSkill.findMany({
      where: { skillId: source.id },
      select: { id: true, profileId: true },
    }),
    db.jobSkill.findMany({ where: { skillId: source.id }, select: { jobId: true } }),
    db.courseSkill.findMany({ where: { skillId: source.id }, select: { courseId: true } }),
  ]);
  const [profilesWithTarget, jobsWithTarget, coursesWithTarget] = await Promise.all([
    db.profileSkill.findMany({
      where: { skillId: target.id, profileId: { in: profiles.map((row) => row.profileId) } },
      select: { profileId: true },
    }),
    db.jobSkill.findMany({
      where: { skillId: target.id, jobId: { in: jobs.map((row) => row.jobId) } },
      select: { jobId: true },
    }),
    db.courseSkill.findMany({
      where: { skillId: target.id, courseId: { in: courses.map((row) => row.courseId) } },
      select: { courseId: true },
    }),
  ]);
  const hasProfile = new Set(profilesWithTarget.map((row) => row.profileId));
  const hasJob = new Set(jobsWithTarget.map((row) => row.jobId));
  const hasCourse = new Set(coursesWithTarget.map((row) => row.courseId));
  const aliases = [...target.aliases];
  for (const name of [source.name, ...source.aliases]) {
    if (![target.name, ...aliases].map(fold).includes(fold(name))) aliases.push(name);
  }
  await db.$transaction([
    db.profileSkill.deleteMany({
      where: { skillId: source.id, profileId: { in: [...hasProfile] } },
    }),
    db.profileSkill.updateMany({ where: { skillId: source.id }, data: { skillId: target.id } }),
    db.jobSkill.deleteMany({ where: { skillId: source.id, jobId: { in: [...hasJob] } } }),
    db.jobSkill.updateMany({ where: { skillId: source.id }, data: { skillId: target.id } }),
    db.courseSkill.deleteMany({
      where: { skillId: source.id, courseId: { in: [...hasCourse] } },
    }),
    db.courseSkill.updateMany({ where: { skillId: source.id }, data: { skillId: target.id } }),
    db.skill.update({ where: { id: target.id }, data: { aliases } }),
    db.skill.delete({ where: { id: source.id } }),
    db.auditLog.create({
      data: {
        actorId,
        action: "skill.merge",
        targetType: "skill",
        targetId: target.id,
        metadata: {
          from: source.name,
          into: target.name,
          profiles: profiles.length,
          jobs: jobs.length,
          courses: courses.length,
          reason: input.reason,
        },
      },
    }),
  ]);
  return { into: target.name };
}
