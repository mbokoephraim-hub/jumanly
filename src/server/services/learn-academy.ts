/**
 * The Learn academy (ux-test, étape 2): what a learner sees in « Mon espace », « Mes parcours » and
 * « Exercices et évaluations », computed from their enrollments and quiz attempts.
 */
import type { LessonKind, PrismaClient } from "@/generated/prisma/client";

export type EvaluationStatus = "todo" | "review" | "passed";

/**
 * Where an evaluation stands: a quiz is passed once an attempt passed, to review when it was tried
 * without passing; an exercise is passed once its lesson is marked done.
 */
export function evaluationStatus(input: {
  kind: LessonKind;
  done: boolean;
  attempts: { passed: boolean }[];
}): EvaluationStatus {
  if (input.kind === "quiz") {
    if (input.attempts.some((attempt) => attempt.passed)) return "passed";
    return input.attempts.length > 0 ? "review" : "todo";
  }
  return input.done ? "passed" : "todo";
}

export type Evaluation = {
  lessonId: string;
  title: string;
  kind: "quiz" | "exercise";
  courseSlug: string;
  courseTitle: string;
  module: number;
  minutes: number;
  questions: number;
  passingScore?: number;
  bestScore?: number;
  attempts: number;
  status: EvaluationStatus;
};

/** Every quiz and exercise of the courses a learner follows, most recent course first. */
export async function learnerEvaluations(db: PrismaClient, userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    select: {
      completedLessons: true,
      course: {
        select: {
          slug: true,
          title: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              order: true,
              lessons: {
                where: { kind: { in: ["quiz", "exercise"] } },
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  kind: true,
                  durationSec: true,
                  quiz: {
                    select: {
                      id: true,
                      passingScore: true,
                      _count: { select: { questions: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const quizIds = enrollments.flatMap((enrollment) =>
    enrollment.course.modules.flatMap((module) =>
      module.lessons.flatMap((lesson) => (lesson.quiz ? [lesson.quiz.id] : [])),
    ),
  );
  const attempts = await db.quizAttempt.findMany({
    where: { userId, quizId: { in: quizIds } },
    select: { quizId: true, score: true, passed: true },
  });

  const evaluations: Evaluation[] = [];
  for (const enrollment of enrollments) {
    const done = new Set(enrollment.completedLessons);
    for (const part of enrollment.course.modules) {
      for (const lesson of part.lessons) {
        const tries = lesson.quiz
          ? attempts.filter((attempt) => attempt.quizId === lesson.quiz?.id)
          : [];
        evaluations.push({
          lessonId: lesson.id,
          title: lesson.title,
          kind: lesson.kind === "quiz" ? "quiz" : "exercise",
          courseSlug: enrollment.course.slug,
          courseTitle: enrollment.course.title,
          module: part.order,
          minutes: Math.max(1, Math.round(lesson.durationSec / 60)),
          questions: lesson.quiz?._count.questions ?? 0,
          passingScore: lesson.quiz?.passingScore,
          bestScore: tries.length ? Math.max(...tries.map((attempt) => attempt.score)) : undefined,
          attempts: tries.length,
          status: evaluationStatus({
            kind: lesson.kind,
            done: done.has(lesson.id),
            attempts: tries,
          }),
        });
      }
    }
  }
  return evaluations;
}

/**
 * The lesson to open next in a course: the first required lesson not done yet, else the last one
 * opened. `null` when the course is finished.
 */
export async function nextLessons(db: PrismaClient, userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId, completedAt: null },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      progress: true,
      completedLessons: true,
      lastLessonId: true,
      course: {
        select: {
          slug: true,
          title: true,
          category: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              order: true,
              title: true,
              lessons: {
                orderBy: { order: "asc" },
                select: { id: true, title: true, order: true, jobSpecific: true, kind: true },
              },
            },
          },
        },
      },
    },
  });
  return enrollments.map((enrollment) => {
    const done = new Set(enrollment.completedLessons);
    const lessons = enrollment.course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({ ...lesson, module: module.order })),
    );
    const required = lessons.filter((lesson) => !lesson.jobSpecific);
    const next =
      required.find((lesson) => !done.has(lesson.id)) ??
      lessons.find((lesson) => lesson.id === enrollment.lastLessonId) ??
      null;
    return {
      enrollmentId: enrollment.id,
      slug: enrollment.course.slug,
      title: enrollment.course.title,
      category: enrollment.course.category,
      progress: enrollment.progress,
      remaining: required.filter((lesson) => !done.has(lesson.id)).length,
      next,
    };
  });
}

/** Courses a learner can ask the AI coach about: those they follow, with their lessons. */
export async function coachCourses(db: PrismaClient, userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId, course: { status: "published" } },
    orderBy: [{ completedAt: { sort: "asc", nulls: "first" } }, { startedAt: "desc" }],
    select: {
      course: {
        select: {
          slug: true,
          title: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              lessons: {
                where: { kind: { not: "quiz" } },
                orderBy: { order: "asc" },
                select: { id: true, title: true },
              },
            },
          },
        },
      },
    },
  });
  return enrollments.map(({ course }) => ({
    slug: course.slug,
    title: course.title,
    lessons: course.modules.flatMap((module) => module.lessons),
  }));
}
