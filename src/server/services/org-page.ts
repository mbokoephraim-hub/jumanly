import type { PrismaClient } from "@/generated/prisma/client";
import { z } from "zod";
import { hirePermissions, HireError, type HireContext } from "./hire";
import { openJobWhere } from "./jobs";
import { declaredMembers } from "./org-team";
import { signupSizes } from "./admin-signup";
import { organizationSizes } from "./recruiter-account";

/**
 * Page entreprise (étape 3, A3, captures 081 et 082): what the administrators change, and the page
 * as a talent sees it. Every read goes through the administrator's organization (golden rule n° 6).
 */

function administer(ctx: HireContext) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
}

/** « baobabfintech.cd » is a site too: the address is kept with its https://. */
function siteOf(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

/** The sizes of the sign-up (A1), and those written by older screens, kept as they are. */
const pageSizes = [...new Set<string>([...Object.values(signupSizes), ...organizationSizes])] as [
  string,
  ...string[],
];

export const companyPageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sector: z.string().trim().max(120).default(""),
  size: z.union([z.literal(""), z.enum(pageSizes)]).default(""),
  city: z.string().trim().max(120).default(""),
  website: z
    .string()
    .max(200)
    .default("")
    .transform(siteOf)
    .pipe(z.union([z.literal(""), z.url().max(208)])),
  description: z.string().trim().max(3000).default(""),
  hiringNow: z.boolean().default(false),
});

export type CompanyPageInput = z.input<typeof companyPageSchema>;

/** « Publier les changements »: the fields of the page, kept in the audit log. */
export async function updateCompanyPage(db: PrismaClient, ctx: HireContext, raw: unknown) {
  administer(ctx);
  const parsed = companyPageSchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { ok: false as const, field: typeof field === "string" ? field : "name" };
  }
  const input = parsed.data;
  await db.$transaction([
    db.organization.update({
      where: { id: ctx.organizationId },
      data: {
        name: input.name,
        sector: input.sector || null,
        size: input.size || null,
        city: input.city || null,
        website: input.website || null,
        description: input.description || null,
        hiringNow: input.hiringNow,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "org.page.update",
        targetType: "organization",
        targetId: ctx.organizationId,
        organizationId: ctx.organizationId,
      },
    }),
  ]);
  return { ok: true as const };
}

const orgSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  banner: true,
  bannerTheme: true,
  description: true,
  sector: true,
  size: true,
  city: true,
  website: true,
  hiringNow: true,
  verifiedAt: true,
  verificationStatus: true,
} as const;

/** The people the page shows: the team (confirmed by the company), then those who say they work there. */
async function pageMembers(db: PrismaClient, organizationId: string) {
  const [team, declared] = await Promise.all([
    db.membership.findMany({
      where: { organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      select: { id: true, jobTitle: true, user: { select: { name: true } } },
    }),
    declaredMembers(db, organizationId),
  ]);
  return [
    ...team.map((member) => ({
      id: member.id,
      name: member.user.name,
      title: member.jobTitle?.trim() || null,
      confirmed: true,
    })),
    ...declared.map((person) => ({
      id: person.experienceId,
      name: person.name,
      title: person.title,
      confirmed: person.status === "confirmed",
    })),
  ];
}

/** Everything the « modifier » screen shows (081). */
export async function companyPageScreen(db: PrismaClient, ctx: HireContext) {
  administer(ctx);
  const [org, pending, team, owners] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: ctx.organizationId }, select: orgSelect }),
    declaredMembers(db, ctx.organizationId).then((items) => items.filter((item) => !item.status)),
    db.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      select: { id: true, userId: true, role: true, user: { select: { name: true } } },
    }),
    db.membership.count({
      where: { organizationId: ctx.organizationId, status: "active", role: "org_owner" },
    }),
  ]);
  const owner = ctx.role === "org_owner" && owners > 0;
  return {
    org,
    pending: pending.map((item) => ({
      experienceId: item.experienceId,
      name: item.name,
      title: item.title,
    })),
    confirmed: team.map((member) => member.user.name),
    /** « Transférer la propriété »: the owner only, to another active member. */
    transferTo: owner
      ? team
          .filter((member) => member.userId !== ctx.userId)
          .map((member) => ({ id: member.id, name: member.user.name }))
      : null,
  };
}

/** The page as a talent sees it (082): presentation, members and open offers. */
export async function companyPagePreview(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const [org, members, offers] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: ctx.organizationId }, select: orgSelect }),
    pageMembers(db, ctx.organizationId),
    db.job.findMany({
      where: { ...openJobWhere(now), organizationId: ctx.organizationId },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: { id: true, slug: true, title: true, city: true, contractType: true },
    }),
  ]);
  return { org, members, offers };
}
