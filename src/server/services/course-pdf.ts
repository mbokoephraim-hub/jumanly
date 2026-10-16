/**
 * The PDFs Jumanly makes for each course (Admin v3, étape 6): the data they read and a small cache.
 * Programme (public), full support (enrolled talents whose plan opens the course), quiz with its
 * answer key, attestation preview and course report (team only). The report holds no name.
 */
import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { lessonParagraphs } from "./learn";

export const coursePdfKinds = ["programme", "support", "quiz", "attestation", "bilan"] as const;
export type CoursePdfKind = (typeof coursePdfKinds)[number];
export const isCoursePdfKind = (value: string): value is CoursePdfKind =>
  (coursePdfKinds as readonly string[]).includes(value);

/** Report periods offered in the editor, in days; anything else means since the course began. */
export const reportPeriods = [30, 90, 365] as const;
export function reportDays(value: string | null) {
  const days = Number(value);
  return (reportPeriods as readonly number[]).includes(days) ? days : null;
}

const pdfCourseInclude = {
  skills: { include: { skill: { select: { name: true } } } },
  modules: {
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { quiz: { include: { questions: { orderBy: { order: "asc" } } } } },
      },
    },
  },
} satisfies Prisma.CourseInclude;

export type PdfCourse = Prisma.CourseGetPayload<{ include: typeof pdfCourseInclude }>;

export function loadPdfCourse(db: PrismaClient, where: Prisma.CourseWhereInput) {
  return db.course.findFirst({ where, include: pdfCourseInclude });
}

/** What the programme shows; the quiz answers never leave this function. */
export function programmeOf(course: PdfCourse) {
  const modules = course.modules.map((module) => ({
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      title: lesson.title,
      kind: lesson.kind,
      minutes: Math.round(lesson.durationSec / 60),
    })),
  }));
  return {
    title: course.title,
    summary: course.summary,
    audience: course.audience,
    prerequisites: course.prerequisites ?? "",
    objectives: course.objectives,
    level: course.level,
    durationMinutes: course.durationMinutes,
    certificate: course.certificateEnabled,
    skills: course.skills.map((item) => item.skill.name),
    modules,
    lessons: modules.reduce((sum, module) => sum + module.lessons.length, 0),
  };
}
export type ProgrammeData = ReturnType<typeof programmeOf>;

/** Every lesson to read offline: paragraphs, video transcripts, the size of each quiz. */
export function supportOf(course: PdfCourse) {
  return {
    title: course.title,
    summary: course.summary,
    modules: course.modules.map((module) => ({
      title: module.title,
      lessons: module.lessons.map((lesson) => ({
        title: lesson.title,
        kind: lesson.kind,
        minutes: Math.round(lesson.durationSec / 60),
        paragraphs: lessonParagraphs(lesson.content),
        transcript: lesson.transcript?.trim() ?? "",
        questions: lesson.quiz?.questions.length ?? 0,
      })),
    })),
  };
}
export type SupportData = ReturnType<typeof supportOf>;

/** The quizzes with their answer key: the text of the right options, never their indices. */
export function quizKeyOf(course: PdfCourse) {
  return {
    title: course.title,
    quizzes: course.modules.flatMap((module) =>
      module.lessons.flatMap((lesson) =>
        lesson.quiz
          ? [
              {
                lesson: lesson.title,
                passingScore: lesson.quiz.passingScore,
                maxAttempts: lesson.quiz.maxAttempts,
                questions: lesson.quiz.questions.map((question) => ({
                  type: question.type,
                  prompt: question.prompt,
                  options: question.options.map((option, index) => ({
                    text: option,
                    right: question.type !== "text" && question.answer.includes(String(index)),
                  })),
                  accepted: question.type === "text" ? question.answer : [],
                  explanation: question.explanation ?? "",
                })),
              },
            ]
          : [],
      ),
    ),
  };
}
export type QuizKeyData = ReturnType<typeof quizKeyOf>;

/**
 * The course report over a period: enrollments, completion, where unfinished learners stopped,
 * quiz averages, attestations. Counts only, no name and no account id.
 */
export async function courseReport(
  db: PrismaClient,
  course: PdfCourse,
  days: number | null,
  now = new Date(),
) {
  const since = days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;
  const inPeriod = since ? { gte: since } : undefined;
  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })),
  );
  const quizIds = lessons.flatMap((lesson) => (lesson.quiz ? [lesson.quiz.id] : []));
  const [enrollments, attempts, issued, revoked] = await Promise.all([
    db.enrollment.findMany({
      where: { courseId: course.id, startedAt: inPeriod },
      select: { completedAt: true, lastLessonId: true },
    }),
    db.quizAttempt.findMany({
      where: { quizId: { in: quizIds }, createdAt: inPeriod },
      select: { quizId: true, score: true, passed: true },
    }),
    db.certificate.count({
      where: { enrollment: { courseId: course.id }, issuedAt: inPeriod },
    }),
    db.certificate.count({
      where: {
        enrollment: { courseId: course.id },
        revokedAt: since ? { gte: since } : { not: null },
      },
    }),
  ]);
  const completed = enrollments.filter((item) => item.completedAt).length;
  const unfinished = enrollments.filter((item) => !item.completedAt);
  const moduleOf = new Map(lessons.map((lesson) => [lesson.id, lesson.moduleId]));
  const stops = course.modules.map((module) => ({
    title: module.title,
    count: unfinished.filter(
      (item) => item.lastLessonId && moduleOf.get(item.lastLessonId) === module.id,
    ).length,
  }));
  const notStarted = unfinished.filter(
    (item) => !item.lastLessonId || !moduleOf.has(item.lastLessonId),
  ).length;
  const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
  const quizzes = lessons.flatMap((lesson) => {
    if (!lesson.quiz) return [];
    const mine = attempts.filter((attempt) => attempt.quizId === lesson.quiz!.id);
    return [
      {
        lesson: lesson.title,
        attempts: mine.length,
        average: mine.length
          ? Math.round(mine.reduce((sum, attempt) => sum + attempt.score, 0) / mine.length)
          : 0,
        passRate: percent(mine.filter((attempt) => attempt.passed).length, mine.length),
      },
    ];
  });
  return {
    title: course.title,
    days,
    enrolled: enrollments.length,
    completed,
    inProgress: unfinished.length,
    completionRate: percent(completed, enrollments.length),
    stops,
    notStarted,
    quizzes,
    issued,
    revoked,
  };
}
export type ReportData = Awaited<ReturnType<typeof courseReport>>;

/** The file name of a course PDF: `programme-reussir-son-cv.pdf`. */
export function coursePdfFileName(kind: CoursePdfKind, slug: string) {
  const prefix = {
    programme: "programme",
    support: "support",
    quiz: "quiz-corrige",
    attestation: "attestation-apercu",
    bilan: "bilan",
  }[kind];
  return `${prefix}-${slug}.pdf`;
}

// ─── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_SIZE = 40;
const cache = new Map<string, Buffer>();

/**
 * A PDF is made once per content: the key is a hash of everything it shows, so any change to the
 * course (a lesson, a question, a document) makes a new one. Kept in memory, the oldest out first.
 */
export async function cachedPdf(kind: string, content: unknown, render: () => Promise<Buffer>) {
  const key = `${kind}:${createHash("sha256").update(JSON.stringify(content)).digest("hex")}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const pdf = await render();
  cache.set(key, pdf);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
  return pdf;
}

export function pdfResponseHeaders(fileName: string) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
}
