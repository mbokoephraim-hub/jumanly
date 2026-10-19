/**
 * Apprendre in the talent space (planche talent-3 § 1): the courses in progress with the lesson to
 * open next, the finished and saved ones, what is left to do (quizzes, exercises) and the counts of
 * the home. Reads only; enrolling, progress and quizzes stay in `learn.ts`.
 */
import type { PrismaClient } from "@/generated/prisma/client";

const followedSelect = {
  id: true,
  progress: true,
  completedLessons: true,
  lastLessonId: true,
  startedAt: true,
  completedAt: true,
  certificate: { select: { id: true, code: true, revokedAt: true } },
  course: {
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      coverUrl: true,
      durationMinutes: true,
      domain: { select: { name: true } },
      modules: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          title: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              kind: true,
              durationSec: true,
              jobSpecific: true,
              content: true,
              quiz: { select: { id: true, _count: { select: { questions: true } } } },
            },
          },
        },
      },
    },
  },
} as const;

/** The courses a talent follows, the most recent first, each with the lesson to open next. */
export async function followedCourses(db: PrismaClient, userId: string) {
  const rows = await db.enrollment.findMany({
    where: { userId, course: { status: "published" } },
    orderBy: { startedAt: "desc" },
    select: followedSelect,
  });
  return rows.map((row) => {
    const done = new Set(row.completedLessons);
    const lessons = row.course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({ ...lesson, module: module.order })),
    );
    const required = lessons.filter((lesson) => !lesson.jobSpecific);
    const next =
      required.find((lesson) => !done.has(lesson.id)) ??
      lessons.find((lesson) => lesson.id === row.lastLessonId) ??
      null;
    const left = required.filter((lesson) => !done.has(lesson.id));
    return {
      id: row.id,
      slug: row.course.slug,
      title: row.course.title,
      category: row.course.category,
      coverUrl: row.course.coverUrl,
      domain: row.course.domain?.name ?? null,
      progress: row.progress,
      finished: Boolean(row.completedAt),
      completedAt: row.completedAt,
      startedAt: row.startedAt,
      certificate: row.certificate?.revokedAt ? null : row.certificate,
      modules: row.course.modules.length,
      next,
      minutesLeft: Math.max(
        1,
        Math.round(left.reduce((sum, lesson) => sum + lesson.durationSec, 0) / 60),
      ),
      /** Minutes left in the module of the next lesson (« Reste 8 min dans ce module »). */
      moduleMinutesLeft: Math.max(
        1,
        Math.round(
          left
            .filter((lesson) => lesson.module === next?.module)
            .reduce((sum, lesson) => sum + lesson.durationSec, 0) / 60,
        ),
      ),
      /** Quizzes not passed yet and exercises not handed in, in the order of the course. */
      todo: lessons.filter(
        (lesson) => !done.has(lesson.id) && (lesson.kind === "quiz" || lesson.kind === "exercise"),
      ),
    };
  });
}

export type FollowedCourse = Awaited<ReturnType<typeof followedCourses>>[number];

/** Saved courses (« Enregistrées »), the newest first. */
export async function savedCourses(db: PrismaClient, userId: string) {
  const rows = await db.savedCourse.findMany({
    where: { userId, course: { status: "published" } },
    orderBy: { createdAt: "desc" },
    select: {
      course: {
        select: {
          slug: true,
          title: true,
          category: true,
          coverUrl: true,
          durationMinutes: true,
          domain: { select: { name: true } },
          _count: { select: { modules: true } },
        },
      },
    },
  });
  return rows.map(({ course }) => ({
    slug: course.slug,
    title: course.title,
    category: course.category,
    coverUrl: course.coverUrl,
    durationMinutes: course.durationMinutes,
    domain: course.domain?.name ?? null,
    modules: course._count.modules,
  }));
}

/** The path that gathers most of the courses found (at least two): Orbi suggests it. */
export async function pathForCourses(db: PrismaClient, slugs: string[]) {
  if (slugs.length < 2) return null;
  const paths = await db.learningPath.findMany({
    where: {
      status: "published",
      courses: { some: { course: { slug: { in: slugs }, status: "published" } } },
    },
    select: {
      slug: true,
      title: true,
      courses: { where: { course: { slug: { in: slugs } } }, select: { courseId: true } },
    },
  });
  const best = paths.sort((a, b) => b.courses.length - a.courses.length)[0];
  return best && best.courses.length >= 2 ? { slug: best.slug, title: best.title } : null;
}

/**
 * The path Orbi suggests on the home of Apprendre (planche web talent-3 § 1): the published path
 * that gathers most of these courses (the ones followed or recommended), not followed yet.
 */
export async function suggestedPath(db: PrismaClient, userId: string, slugs: string[]) {
  if (slugs.length === 0) return null;
  const paths = await db.learningPath.findMany({
    where: {
      status: "published",
      followers: { none: { userId } },
      courses: { some: { course: { slug: { in: slugs }, status: "published" } } },
    },
    select: {
      slug: true,
      title: true,
      courses: {
        where: { course: { status: "published" } },
        select: { course: { select: { slug: true } } },
      },
    },
  });
  const score = (path: (typeof paths)[number]) =>
    path.courses.filter((item) => slugs.includes(item.course.slug)).length;
  const best = paths.sort((a, b) => score(b) - score(a))[0];
  return best ? { slug: best.slug, title: best.title, count: best.courses.length } : null;
}
