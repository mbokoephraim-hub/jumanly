/** Public course catalog (Learn), read without an account (docs/specifications.md, partie 07 § 1). */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { catalogLevels } from "./plans";

export const COURSES_PER_PAGE = 12;

export const courseLevels = ["beginner", "intermediate", "advanced"] as const;
export const courseSorts = ["recent", "popular", "duration"] as const;

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
      { skills: { some: { skill: { name: { contains: filters.q, mode: "insensitive" } } } } },
    ];
  }
  if (filters.theme) where.category = filters.theme;
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
  level: true,
  durationMinutes: true,
  coverUrl: true,
  requiredLevel: true,
  certificateEnabled: true,
  _count: { select: { modules: true } },
  modules: { select: { _count: { select: { lessons: true } } } },
} satisfies Prisma.CourseSelect;

type CardRow = Prisma.CourseGetPayload<{ select: typeof cardSelect }>;

export type CourseSummary = Omit<CardRow, "_count" | "modules"> & { lessonCount: number };

function toSummary({ _count, modules, ...course }: CardRow): CourseSummary {
  void _count;
  return {
    ...course,
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
    where: { status: "published" },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

/** Courses shown on the home page: free ones first, then the most followed. */
export async function featuredCourses(db: PrismaClient, take = 3) {
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
