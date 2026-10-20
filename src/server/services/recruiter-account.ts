/**
 * Compte RH and the first steps of a recruiter (docs/refonte-mobile, brief recruteur lot 1).
 * The profile changes the person's name and their job title in the active organization; the
 * first steps say who the organization recruits for and describe it. Both need the active
 * membership (`HireContext`); describing the organization needs the right to administer it.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { z } from "zod";
import { HireError, hirePermissions, type HireContext } from "./hire";

export const recruiterProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  jobTitle: z.string().trim().max(120).default(""),
});

export async function saveRecruiterProfile(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
) {
  const parsed = recruiterProfileSchema.safeParse(raw);
  if (!parsed.success) return false;
  await db.$transaction([
    db.user.update({ where: { id: ctx.userId }, data: { name: parsed.data.name } }),
    db.membership.update({
      where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
      data: { jobTitle: parsed.data.jobTitle || null },
    }),
  ]);
  return true;
}

/**
 * « Vous recrutez pour… » (planche recruteur-3 OBR1). An independent recruiter is stored as a
 * consultant, the category of the organization profile (`org.profile.category.*`).
 */
export const recruitingFor = ["company", "consultant", "independent", "education"] as const;
export type RecruitingFor = (typeof recruitingFor)[number];

export const organizationSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export async function saveRecruitingFor(db: PrismaClient, ctx: HireContext, value: unknown) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  const parsed = z.enum(recruitingFor).safeParse(value);
  if (!parsed.success) return false;
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: { category: parsed.data === "independent" ? "consultant" : parsed.data },
  });
  return true;
}

export const firstStepsOrgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  country: z.union([z.literal(""), z.string().regex(/^[A-Z]{2}$/)]).default(""),
  sector: z.string().trim().max(120).default(""),
  size: z.union([z.literal(""), z.enum(organizationSizes)]).default(""),
});

/** « Votre organisation » (planche recruteur-3 OBR2): only what was typed is written. */
export async function saveFirstStepsOrganization(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  const parsed = firstStepsOrgSchema.safeParse(raw);
  if (!parsed.success) return false;
  const input = parsed.data;
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: {
      name: input.name,
      ...(input.country && { country: input.country }),
      ...(input.sector && { sector: input.sector }),
      ...(input.size && { size: input.size }),
    },
  });
  return true;
}
