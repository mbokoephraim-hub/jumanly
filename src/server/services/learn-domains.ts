/**
 * Domains and editorial lines of the Learn catalog (Learn v2, étape 1): Domaine → Formation.
 * The 7 starting domains are created by the migration `learn_domains`; the team edits them in
 * /admin/formations/domaines. A course belongs to one domain at most.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IconName } from "@/components/brand/icon";

export const editorialLines = ["originals", "expert_series", "partner_programs"] as const;
export type EditorialLineKey = (typeof editorialLines)[number];

/** Icons a domain may take in the admin (brand icons only). */
export const domainIcons = [
  "career",
  "grid",
  "edit",
  "entreprise",
  "message",
  "intelligence",
  "mobile-money",
  "learn",
  "statistiques",
  "objectif",
  "langue",
  "competence",
  "partager",
  "cv",
] as const satisfies readonly IconName[];

/**
 * Themes (`Course.category`) of courses filed before the domains existed, mapped to their domain
 * (same mapping as the migration; used by the seed for the demo courses).
 */
export const domainOfTheme: Record<string, string> = {
  carrière: "career-employability",
  employabilité: "career-employability",
  "compétences de vie": "career-employability",
  "compétences comportementales": "career-employability",
  bureautique: "digital-productivity",
  "compétences numériques": "digital-productivity",
  communication: "professional-communication",
  "relation client": "professional-communication",
  "gestion de projet": "business-management",
  management: "business-management",
  "intelligence artificielle": "ai-digital-tools",
};

/** The domains in their order, with the number of published courses in each. */
export async function listDomains(db: PrismaClient) {
  const rows = await db.learningDomain.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      order: true,
      _count: { select: { courses: { where: { status: "published" } } } },
    },
  });
  return rows.map(({ _count, ...domain }) => ({
    ...domain,
    icon: asDomainIcon(domain.icon),
    courseCount: _count.courses,
  }));
}

export type DomainSummary = Awaited<ReturnType<typeof listDomains>>[number];

export const asDomainIcon = (icon: string): IconName =>
  (domainIcons as readonly string[]).includes(icon) ? (icon as IconName) : "learn";

/** Languages of the published courses (catalog filter), most common first. */
export async function listCourseLanguages(db: PrismaClient) {
  const rows = await db.course.groupBy({
    by: ["language"],
    where: { status: "published" },
    _count: true,
    orderBy: { _count: { language: "desc" } },
  });
  return rows.map((row) => row.language);
}

/** Skills taught by at least one published course (catalog filter), by name. */
export async function listCourseSkills(db: PrismaClient) {
  return db.skill.findMany({
    where: { courses: { some: { course: { status: "published" } } } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ─── Administration ─────────────────────────────────────────────

const text = (max: number) => z.string().trim().max(max);

export const domainFormSchema = z.object({
  name: text(80).min(2),
  description: text(300),
  icon: z.enum(domainIcons),
  order: z.coerce.number().int().min(0).max(999),
});

export type DomainInput = z.infer<typeof domainFormSchema>;

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "domaine";

async function uniqueDomainSlug(db: PrismaClient, name: string, id?: string) {
  const base = slugify(name);
  for (let index = 1; ; index++) {
    const slug = index === 1 ? base : `${base}-${index}`;
    const taken = await db.learningDomain.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === id) return slug;
  }
}

export async function createDomain(db: PrismaClient, input: DomainInput) {
  return db.learningDomain.create({
    data: { ...input, slug: await uniqueDomainSlug(db, input.name) },
  });
}

/** Renaming keeps the address (slug) so that shared links still work. */
export async function updateDomain(db: PrismaClient, id: string, input: DomainInput) {
  return db.learningDomain.update({ where: { id }, data: input });
}

/** Deleting a domain leaves its courses without domain (never deletes a course). */
export async function deleteDomain(db: PrismaClient, id: string) {
  return db.learningDomain.delete({ where: { id } });
}
