/**
 * Learning paths (Learn v2, étape 2): Domaine → Parcours → Formation. A path is an ordered series
 * of published courses. It opens no course by itself: each course keeps its catalog level
 * (`learn.catalog.level`). Progress is read from the learner's course enrollments.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { catalogLevelOf, enroll, opensCourse } from "./learn";
import { editorialLines, slugify } from "./learn-domains";

export type PathCourseState = "done" | "active" | "todo" | "locked";

/** Minimum number of published courses before a path can be published. */
export const PATH_MIN_COURSES = 2;
export const PATH_MAX_COURSES = 20;

/** Share of the path's courses finished, and the course to take next (first one not finished). */
export function pathProgress<T extends { state: PathCourseState }>(courses: T[]) {
  const done = courses.filter((course) => course.state === "done").length;
  return {
    done,
    total: courses.length,
    percent: courses.length ? Math.round((done / courses.length) * 100) : 0,
    next: courses.find((course) => course.state !== "done") ?? null,
    finished: courses.length > 0 && done === courses.length,
  };
}

const pathCourseSelect = {
  order: true,
  course: {
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      status: true,
      level: true,
      durationMinutes: true,
      requiredLevel: true,
      certificateEnabled: true,
      category: true,
      coverUrl: true,
    },
  },
} as const;

/** Published paths for the catalog (optionally of one domain), with their published courses. */
export async function listPublishedPaths(db: PrismaClient, domainSlug?: string) {
  const rows = await db.learningPath.findMany({
    where: { status: "published", ...(domainSlug ? { domain: { slug: domainSlug } } : {}) },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    select: {
      slug: true,
      title: true,
      summary: true,
      editorialLine: true,
      domain: { select: { slug: true, name: true } },
      courses: {
        where: { course: { status: "published" } },
        orderBy: { order: "asc" },
        select: { course: { select: { slug: true, durationMinutes: true } } },
      },
    },
  });
  return rows
    .filter((path) => path.courses.length > 0)
    .map(({ courses, ...path }) => ({
      ...path,
      courseCount: courses.length,
      durationMinutes: courses.reduce((sum, item) => sum + item.course.durationMinutes, 0),
      courseSlugs: courses.map((item) => item.course.slug),
    }));
}

export type PathSummary = Awaited<ReturnType<typeof listPublishedPaths>>[number];

/** One published path for a learner: each course with its state, the progress and the next step. */
export async function getPathForLearner(db: PrismaClient, userId: string, slug: string) {
  const path = await db.learningPath.findFirst({
    where: { slug, status: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      editorialLine: true,
      domain: { select: { slug: true, name: true, icon: true } },
      courses: {
        where: { course: { status: "published" } },
        orderBy: { order: "asc" },
        select: pathCourseSelect,
      },
    },
  });
  if (!path) return null;
  const [planLevel, enrollments, follow] = await Promise.all([
    catalogLevelOf(db, userId),
    db.enrollment.findMany({
      where: { userId, courseId: { in: path.courses.map((item) => item.course.id) } },
      select: { courseId: true, progress: true, completedAt: true },
    }),
    db.learningPathFollow.findUnique({
      where: { userId_pathId: { userId, pathId: path.id } },
      select: { startedAt: true },
    }),
  ]);
  const byCourse = new Map(enrollments.map((enrollment) => [enrollment.courseId, enrollment]));
  const courses = path.courses.map(({ course }) => {
    const enrollment = byCourse.get(course.id);
    const state: PathCourseState = enrollment?.completedAt
      ? "done"
      : enrollment
        ? "active"
        : opensCourse(planLevel, course.requiredLevel)
          ? "todo"
          : "locked";
    return { ...course, state, progress: enrollment?.progress ?? 0 };
  });
  return {
    ...path,
    courses,
    followed: Boolean(follow),
    durationMinutes: courses.reduce((sum, course) => sum + course.durationMinutes, 0),
    ...pathProgress(courses),
  };
}

export type LearnerPath = NonNullable<Awaited<ReturnType<typeof getPathForLearner>>>;

/**
 * Follow a path and enroll in its next course when the plan opens it. Returns the next course, or
 * `null` when every course is already finished; `undefined` when the path does not exist.
 */
export async function followPath(db: PrismaClient, userId: string, slug: string) {
  const path = await getPathForLearner(db, userId, slug);
  if (!path) return undefined;
  await db.learningPathFollow.upsert({
    where: { userId_pathId: { userId, pathId: path.id } },
    create: { userId, pathId: path.id },
    update: {},
  });
  if (path.next?.state === "todo") await enroll(db, userId, path.next.slug);
  return path.next;
}

/** Stop following a path: the course enrollments and their progress stay. */
export async function unfollowPath(db: PrismaClient, userId: string, slug: string) {
  await db.learningPathFollow.deleteMany({ where: { userId, path: { slug } } });
}

/** Paths a learner follows (« Mes parcours »), most recent first, with their progress. */
export async function myPaths(db: PrismaClient, userId: string) {
  const follows = await db.learningPathFollow.findMany({
    where: { userId, path: { status: "published" } },
    orderBy: { startedAt: "desc" },
    select: { path: { select: { slug: true } } },
  });
  const paths = await Promise.all(
    follows.map((follow) => getPathForLearner(db, userId, follow.path.slug)),
  );
  return paths.filter((path): path is LearnerPath => path !== null);
}

// ─── Administration ─────────────────────────────────────────────

const text = (max: number) => z.string().trim().max(max);

export const pathFormSchema = z.object({
  title: text(120).min(3),
  summary: text(600),
  domainId: text(40).default(""),
  editorialLine: z.enum(editorialLines).default("originals"),
});

export type PathInput = z.infer<typeof pathFormSchema>;

export const pathStatuses = ["draft", "published", "archived"] as const;

async function uniquePathSlug(db: PrismaClient, title: string) {
  const base = slugify(title).replace(/^domaine$/, "parcours");
  for (let index = 1; ; index++) {
    const slug = index === 1 ? base : `${base}-${index}`;
    const taken = await db.learningPath.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
}

export async function listPathsForAdmin(db: PrismaClient) {
  return db.learningPath.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      domain: { select: { name: true } },
      _count: { select: { courses: true, followers: true } },
    },
  });
}

export async function getPathForAdmin(db: PrismaClient, id: string) {
  return db.learningPath.findUnique({
    where: { id },
    include: {
      courses: { orderBy: { order: "asc" }, select: pathCourseSelect },
      _count: { select: { followers: true } },
    },
  });
}

export type AdminPath = NonNullable<Awaited<ReturnType<typeof getPathForAdmin>>>;

export async function createPath(db: PrismaClient, title: string) {
  return db.learningPath.create({ data: { title, slug: await uniquePathSlug(db, title) } });
}

/** Saves the path's information; an unknown domain is ignored. The address (slug) never changes. */
export async function updatePath(db: PrismaClient, id: string, input: PathInput) {
  const domain = input.domainId
    ? await db.learningDomain.findUnique({ where: { id: input.domainId }, select: { id: true } })
    : null;
  return db.learningPath.update({
    where: { id },
    data: {
      title: input.title,
      summary: input.summary,
      editorialLine: input.editorialLine,
      domainId: domain?.id ?? null,
    },
  });
}

/** Rewrites the order of the path's courses (0, 1, 2…) after a change. */
async function writeOrder(db: PrismaClient, pathId: string, courseIds: string[]) {
  await db.$transaction(
    courseIds.map((courseId, order) =>
      db.learningPathCourse.update({
        where: { pathId_courseId: { pathId, courseId } },
        data: { order },
      }),
    ),
  );
}

async function orderedIds(db: PrismaClient, pathId: string) {
  const rows = await db.learningPathCourse.findMany({
    where: { pathId },
    orderBy: { order: "asc" },
    select: { courseId: true },
  });
  return rows.map((row) => row.courseId);
}

export type PathCourseChange = "added" | "already" | "full" | "notFound";

/** Adds a course (draft or published) at the end of the path. */
export async function addCourseToPath(
  db: PrismaClient,
  pathId: string,
  courseId: string,
): Promise<PathCourseChange> {
  const course = await db.course.findFirst({
    where: { id: courseId, status: { not: "archived" } },
    select: { id: true },
  });
  if (!course) return "notFound";
  const ids = await orderedIds(db, pathId);
  if (ids.includes(courseId)) return "already";
  if (ids.length >= PATH_MAX_COURSES) return "full";
  await db.learningPathCourse.create({ data: { pathId, courseId, order: ids.length } });
  return "added";
}

export async function removeCourseFromPath(db: PrismaClient, pathId: string, courseId: string) {
  await db.learningPathCourse.deleteMany({ where: { pathId, courseId } });
  await writeOrder(db, pathId, await orderedIds(db, pathId));
}

/** Moves a course one place up (-1) or down (+1). */
export async function moveCourseInPath(
  db: PrismaClient,
  pathId: string,
  courseId: string,
  direction: -1 | 1,
) {
  const ids = await orderedIds(db, pathId);
  const from = ids.indexOf(courseId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to]!, ids[from]!];
  await writeOrder(db, pathId, ids);
}

/** Why a path cannot be published yet (empty when it can). */
export function pathPublishProblems(path: Pick<AdminPath, "summary" | "courses">) {
  const problems: ("summary" | "courses")[] = [];
  if (!path.summary.trim()) problems.push("summary");
  const published = path.courses.filter((item) => item.course.status === "published").length;
  if (published < PATH_MIN_COURSES) problems.push("courses");
  return problems;
}

export async function setPathStatus(
  db: PrismaClient,
  id: string,
  status: (typeof pathStatuses)[number],
  now = new Date(),
) {
  const path = await getPathForAdmin(db, id);
  if (!path) return { ok: false as const, problems: [] };
  if (status === "published") {
    const problems = pathPublishProblems(path);
    if (problems.length) return { ok: false as const, problems };
  }
  await db.learningPath.update({
    where: { id },
    data: {
      status,
      ...(status === "published" && !path.publishedAt ? { publishedAt: now } : {}),
    },
  });
  return { ok: true as const, problems: [] };
}
