/** Public course catalog (Learn), read without an account (docs/specifications.md, partie 07 § 1). */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { catalogLevels } from "./plans";

export const COURSES_PER_PAGE = 12;

export const courseLevels = ["beginner", "intermediate", "advanced"] as const;
export const courseSorts = ["recent", "popular", "duration"] as const;
/** Duration filter (Learn v2, étape 1): under 1 h (refonte mobile), under 2 h, 2 to 10 h, over 10 h. */
export const durationFilters = ["heure", "court", "moyen", "long"] as const;
export const editorialFilters = ["originals", "expert_series", "partner_programs"] as const;

/** Catalog levels offered in the "Accès" filter: "free", or "included up to this level". */
export const accessFilters = ["free", "fundamentals", "standard", "advanced"] as const;

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

/** Query string of /formations. Invalid values are ignored rather than rejected. */
export const courseFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  theme: z.string().trim().max(80).optional().catch(undefined),
  niveau: optionalEnum(courseLevels),
  acces: optionalEnum(accessFilters),
  domaine: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,60}$/)
    .optional()
    .catch(undefined),
  langue: z
    .string()
    .trim()
    .regex(/^[a-z]{2,3}(-[A-Za-z]{2})?$/)
    .optional()
    .catch(undefined),
  duree: optionalEnum(durationFilters),
  competence: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,80}$/)
    .optional()
    .catch(undefined),
  ligne: optionalEnum(editorialFilters),
  /** « Avec attestation » (Apprendre, planche web talent-3 § 2). */
  attestation: optionalEnum(["1"] as const),
  tri: optionalEnum(courseSorts),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

export type CourseFilters = z.infer<typeof courseFiltersSchema>;

export function parseCourseFilters(params: Record<string, string | string[] | undefined>) {
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const parsed = courseFiltersSchema.parse(flat);
  return Object.fromEntries(
    Object.entries(parsed).filter(([, v]) => v !== undefined && v !== ""),
  ) as CourseFilters;
}

export function courseWhere(filters: CourseFilters): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = { status: "published" };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { summary: { contains: filters.q, mode: "insensitive" } },
      { category: { contains: filters.q, mode: "insensitive" } },
      { domain: { name: { contains: filters.q, mode: "insensitive" } } },
      { skills: { some: { skill: { name: { contains: filters.q, mode: "insensitive" } } } } },
    ];
  }
  if (filters.theme) where.category = filters.theme;
  if (filters.domaine) where.domain = { slug: filters.domaine };
  if (filters.langue) where.language = filters.langue;
  if (filters.duree === "heure") where.durationMinutes = { lt: 60 };
  else if (filters.duree === "court") where.durationMinutes = { lt: 120 };
  else if (filters.duree === "moyen") where.durationMinutes = { gte: 120, lte: 600 };
  else if (filters.duree === "long") where.durationMinutes = { gt: 600 };
  if (filters.competence) where.skills = { some: { skill: { slug: filters.competence } } };
  if (filters.ligne) where.editorialLine = filters.ligne;
  if (filters.attestation) where.certificateEnabled = true;
  if (filters.niveau) where.level = filters.niveau;
  if (filters.acces === "free") where.requiredLevel = "free";
  else if (filters.acces) {
    const max = catalogLevels.indexOf(filters.acces);
    where.requiredLevel = { in: [...catalogLevels.slice(0, max + 1)] };
  }
  return where;
}

export function courseOrderBy(sort: CourseFilters["tri"]): Prisma.CourseOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
      return [{ enrollmentCount: "desc" }, { title: "asc" }];
    case "duration":
      return [{ durationMinutes: "asc" }, { title: "asc" }];
    default:
      return [{ publishedAt: "desc" }, { title: "asc" }];
  }
}

const cardSelect = {
  slug: true,
  title: true,
  summary: true,
  category: true,
  domain: { select: { slug: true, name: true } },
  editorialLine: true,
  level: true,
  durationMinutes: true,
  coverUrl: true,
  requiredLevel: true,
  certificateEnabled: true,
  instructor: true,
  _count: { select: { modules: true } },
  modules: { select: { _count: { select: { lessons: true } } } },
} satisfies Prisma.CourseSelect;

type CardRow = Prisma.CourseGetPayload<{ select: typeof cardSelect }>;

export type CourseSummary = Omit<CardRow, "_count" | "modules"> & {
  moduleCount: number;
  lessonCount: number;
};

function toSummary({ _count, modules, ...course }: CardRow): CourseSummary {
  return {
    ...course,
    moduleCount: _count.modules,
    lessonCount: modules.reduce((sum, module) => sum + module._count.lessons, 0),
  };
}

export async function searchCourses(db: PrismaClient, filters: CourseFilters) {
  const where = courseWhere(filters);
  const page = filters.page ?? 1;
  const [total, rows] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      orderBy: courseOrderBy(filters.tri),
      skip: (page - 1) * COURSES_PER_PAGE,
      take: COURSES_PER_PAGE,
      select: cardSelect,
    }),
  ]);
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / COURSES_PER_PAGE)),
    courses: rows.map(toSummary),
  };
}

/** Cards of published courses, by id (« Mes formations », « Enregistrées »). */
export async function courseSummariesByIds(db: PrismaClient, ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.course.findMany({
    where: { id: { in: ids }, status: "published" },
    select: { id: true, ...cardSelect },
  });
  const byId = new Map(rows.map(({ id, ...row }) => [id, toSummary(row)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function countPublishedCourses(db: PrismaClient) {
  return db.course.count({ where: { status: "published" } });
}

export async function listCourseThemes(db: PrismaClient): Promise<string[]> {
  const rows = await db.course.findMany({
    // A course published without a theme has no filter of its own (an empty radio has no label).
    where: { status: "published", category: { not: "" } },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

/** Courses shown on the home page: free ones first, then the most followed. */
export async function featuredCourses(db: PrismaClient, take = 4) {
  const rows = await db.course.findMany({
    where: { status: "published" },
    orderBy: [{ requiredLevel: "asc" }, { enrollmentCount: "desc" }],
    take,
    select: cardSelect,
  });
  return rows.map(toSummary);
}

export async function getPublicCourse(db: PrismaClient, slug: string) {
  return db.course.findFirst({
    where: { slug, status: "published" },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      skills: { include: { skill: { select: { name: true } } } },
    },
  });
}

export type PublicCourse = NonNullable<Awaited<ReturnType<typeof getPublicCourse>>>;

export async function relatedCourses(
  db: PrismaClient,
  course: { slug: string; category: string },
  take = 3,
) {
  const rows = await db.course.findMany({
    where: { status: "published", category: course.category, slug: { not: course.slug } },
    orderBy: { enrollmentCount: "desc" },
    take,
    select: cardSelect,
  });
  return rows.map(toSummary);
}

export async function listCourseSlugs(db: PrismaClient) {
  return db.course.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
  });
}
