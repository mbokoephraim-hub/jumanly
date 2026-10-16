/**
 * Learn for a signed-in talent (partie 06 § 6.9, partie 07 § 3): access by `learn.catalog.level`,
 * enrollment, progress, quizzes and the attestation that adds verified skills to the profile.
 */
import { randomInt } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient, QuestionType } from "@/generated/prisma/client";
import { can, level, type Subject } from "@/server/entitlements";
import { catalogRank } from "./plans";
import { ensureProfile, refreshCompleteness } from "./profile";

/** A course opens when the plan's catalog level reaches the level the course requires. */
export function opensCourse(planLevel: string, requiredLevel: string) {
  return requiredLevel === "free" || catalogRank(planLevel) >= catalogRank(requiredLevel);
}

export async function catalogLevelOf(db: PrismaClient, userId: string) {
  const subject: Subject = { type: "user", id: userId };
  return (await level(db, subject, "learn.catalog.level")) || "free";
}

const courseInclude = {
  skills: { include: { skill: { select: { name: true } } } },
  modules: {
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { quiz: { include: { _count: { select: { questions: true } } } } },
      },
    },
  },
} satisfies Prisma.CourseInclude;

export type LearnerCourse = Prisma.CourseGetPayload<{ include: typeof courseInclude }>;

export function lessonsOf(course: Pick<LearnerCourse, "modules">) {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, module })),
  );
}

/**
 * Lessons that count in progress and for the attestation: job-specific exercises
 * (`learn.exercises.job_specific`) are optional extras, so a plan without them can finish.
 */
export function requiredLessons(course: Pick<LearnerCourse, "modules">) {
  return lessonsOf(course).filter((lesson) => !lesson.jobSpecific);
}

/**
 * The module a lesson belongs to, when every required lesson of that module is now done: the
 * player then celebrates the module (ux-test, étape 4). `null` while lessons remain.
 */
export function finishedModule(
  course: Pick<LearnerCourse, "modules">,
  completedLessons: readonly string[],
  lessonId: string,
) {
  const owner = course.modules.find((item) =>
    item.lessons.some((lesson) => lesson.id === lessonId),
  );
  if (!owner) return null;
  const done = new Set(completedLessons);
  return owner.lessons.every((lesson) => lesson.jobSpecific || done.has(lesson.id)) ? owner : null;
}

export const JOB_EXERCISES_KEY = "learn.exercises.job_specific";

/** A published course with its program, the learner's enrollment and whether it is open. */
export async function getLearnerCourse(db: PrismaClient, userId: string, slug: string) {
  const course = await db.course.findFirst({
    where: { slug, status: "published" },
    include: courseInclude,
  });
  if (!course) return null;
  const [planLevel, enrollment, saved] = await Promise.all([
    catalogLevelOf(db, userId),
    db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      include: { certificate: true },
    }),
    db.savedCourse.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } }),
  ]);
  return {
    course,
    enrollment,
    saved: Boolean(saved),
    open: opensCourse(planLevel, course.requiredLevel),
  };
}

export type EnrollResult = "enrolled" | "already" | "locked" | "notFound";

export async function enroll(
  db: PrismaClient,
  userId: string,
  slug: string,
): Promise<EnrollResult> {
  const found = await getLearnerCourse(db, userId, slug);
  if (!found) return "notFound";
  if (found.enrollment) return "already";
  if (!found.open) return "locked";
  try {
    await db.$transaction([
      db.enrollment.create({ data: { userId, courseId: found.course.id } }),
      db.course.update({
        where: { id: found.course.id },
        data: { enrollmentCount: { increment: 1 } },
      }),
    ]);
  } catch {
    return "already";
  }
  return "enrolled";
}

export class LearnError extends Error {
  constructor(readonly code: "notFound" | "locked" | "notEnrolled" | "attempts" | "invalid") {
    super(code);
    this.name = "LearnError";
  }
}

/** The lesson, its course and the learner's enrollment; the course must be open to them. */
export async function lessonContext(db: PrismaClient, userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { course: { select: { slug: true } } } } },
  });
  if (!lesson) throw new LearnError("notFound");
  const found = await getLearnerCourse(db, userId, lesson.module.course.slug);
  if (!found) throw new LearnError("notFound");
  if (!found.open) throw new LearnError("locked");
  if (!found.enrollment) throw new LearnError("notEnrolled");
  if (lesson.jobSpecific && !(await can(db, { type: "user", id: userId }, JOB_EXERCISES_KEY)))
    throw new LearnError("locked");
  return { ...found, enrollment: found.enrollment, lesson };
}

const percentOf = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100);

async function markDone(
  db: PrismaClient,
  ctx: Awaited<ReturnType<typeof lessonContext>>,
  lessonId: string,
) {
  const all = lessonsOf(ctx.course).map((lesson) => lesson.id);
  const required = requiredLessons(ctx.course).map((lesson) => lesson.id);
  const done = [...new Set([...ctx.enrollment.completedLessons, lessonId])].filter((id) =>
    all.includes(id),
  );
  await db.enrollment.update({
    where: { id: ctx.enrollment.id },
    data: {
      completedLessons: done,
      progress: percentOf(done.filter((id) => required.includes(id)).length, required.length),
      lastLessonId: lessonId,
    },
  });
  return maybeCertify(db, ctx.enrollment.id);
}

/** « Marquer comme terminée » for a video, text, exercise or resource lesson. */
export async function completeLesson(db: PrismaClient, userId: string, lessonId: string) {
  const ctx = await lessonContext(db, userId, lessonId);
  if (ctx.lesson.kind === "quiz") throw new LearnError("invalid");
  return markDone(db, ctx, lessonId);
}

export async function rememberLesson(db: PrismaClient, userId: string, lessonId: string) {
  await db.enrollment.updateMany({
    where: { userId, course: { modules: { some: { lessons: { some: { id: lessonId } } } } } },
    data: { lastLessonId: lessonId },
  });
}

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export type QuizQuestion = { id: string; type: QuestionType; options: string[]; answer: string[] };
export type QuizAnswers = Record<string, string[]>;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Each question is right or wrong; a multiple-choice question needs exactly the right options. */
export function scoreQuiz(questions: QuizQuestion[], answers: QuizAnswers) {
  const results = questions.map((question) => {
    const given = (answers[question.id] ?? []).filter(Boolean);
    let correct: boolean;
    if (question.type === "text") {
      correct =
        given.length > 0 &&
        question.answer.some((accepted) => normalizeText(accepted) === normalizeText(given[0]!));
    } else {
      const expected = [...question.answer].sort();
      const chosen = [...new Set(given)].sort();
      correct =
        expected.length === chosen.length &&
        expected.every((value, index) => value === chosen[index]);
    }
    return { questionId: question.id, correct };
  });
  const correct = results.filter((result) => result.correct).length;
  return {
    results,
    correct,
    total: questions.length,
    percent: percentOf(correct, questions.length),
  };
}

export async function attemptsLeft(
  db: PrismaClient,
  userId: string,
  quiz: { id: string; maxAttempts: number },
) {
  if (quiz.maxAttempts <= 0) return null;
  const used = await db.quizAttempt.count({ where: { userId, quizId: quiz.id } });
  return Math.max(0, quiz.maxAttempts - used);
}

export async function submitQuiz(
  db: PrismaClient,
  userId: string,
  lessonId: string,
  answers: QuizAnswers,
) {
  const ctx = await lessonContext(db, userId, lessonId);
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz || quiz.questions.length === 0) throw new LearnError("notFound");
  const left = await attemptsLeft(db, userId, quiz);
  if (left === 0) throw new LearnError("attempts");
  const score = scoreQuiz(quiz.questions, answers);
  const passed = score.percent >= quiz.passingScore;
  const attempt = await db.quizAttempt.create({
    data: {
      userId,
      quizId: quiz.id,
      score: score.percent,
      answers: Object.fromEntries(
        quiz.questions.map((q) => [q.id, (answers[q.id] ?? []).slice(0, 10)]),
      ),
      passed,
    },
  });
  const certificate = passed ? await markDone(db, ctx, lessonId) : null;
  return { attemptId: attempt.id, passed, certificate };
}

// ─── Attestation ─────────────────────────────────────────────────────────────

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** JMN-XXXX-XXXX, without letters and digits that look alike. */
export function certificateCode() {
  const part = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `JMN-${part()}-${part()}`;
}

/**
 * When every lesson is done (quizzes passed), the course is finished; with an attestation, its
 * skills become verified skills of the profile (source « course »), at least at the level granted.
 * Returns the new certificate, or null.
 */
export async function maybeCertify(db: PrismaClient, enrollmentId: string, now = new Date()) {
  const enrollment = await db.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: {
      certificate: true,
      user: { select: { name: true } },
      course: { include: courseInclude },
    },
  });
  const all = requiredLessons(enrollment.course).map((lesson) => lesson.id);
  const finished = all.length > 0 && all.every((id) => enrollment.completedLessons.includes(id));
  if (!finished) return null;
  if (!enrollment.completedAt) {
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { completedAt: now, progress: 100 },
    });
  }
  if (!enrollment.course.certificateEnabled || enrollment.certificate) return null;
  let certificate = null;
  for (let attempt = 0; attempt < 5 && !certificate; attempt++) {
    try {
      certificate = await db.certificate.create({
        data: {
          enrollmentId: enrollment.id,
          code: certificateCode(),
          holderName: enrollment.user.name,
          courseTitle: enrollment.course.title,
          hours: Math.max(1, Math.round(enrollment.course.durationMinutes / 60)),
          issuedAt: now,
        },
      });
    } catch (error) {
      // A code already taken: draw another. The same enrollment twice: someone else issued it.
      if (await db.certificate.findUnique({ where: { enrollmentId: enrollment.id } })) return null;
      if (attempt === 4) throw error;
    }
  }
  if (!certificate) return null;
  const profile = await ensureProfile(db, enrollment.userId);
  for (const { skillId, levelGranted } of enrollment.course.skills) {
    const existing = await db.profileSkill.findUnique({
      where: { profileId_skillId: { profileId: profile.id, skillId } },
    });
    const data = {
      verified: true,
      source: "course" as const,
      level: Math.max(existing?.level ?? 0, levelGranted),
      proof: "certificate",
      proofUrl: `/attestations/${certificate.code}`,
    };
    if (existing) await db.profileSkill.update({ where: { id: existing.id }, data });
    else await db.profileSkill.create({ data: { profileId: profile.id, skillId, ...data } });
  }
  await refreshCompleteness(db, profile.id);
  return certificate;
}

export async function verifyCertificate(db: PrismaClient, code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^JMN-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) return null;
  return db.certificate.findUnique({ where: { code: normalized } });
}

export async function revokeCertificate(
  db: PrismaClient,
  actorId: string,
  code: string,
  now = new Date(),
  /** Reason given in the admin (« Motif »), kept in the audit log. */
  reason?: string,
) {
  const certificate = await verifyCertificate(db, code);
  if (!certificate || certificate.revokedAt) return false;
  await db.certificate.update({ where: { id: certificate.id }, data: { revokedAt: now } });
  await db.auditLog.create({
    data: {
      actorId,
      action: "certificate.revoke",
      targetType: "certificate",
      targetId: certificate.id,
      ...(reason ? { metadata: { reason } } : {}),
    },
  });
  return true;
}

// ─── Lists, notes, saved courses ────────────────────────────────────────────────

export async function myEnrollments(db: PrismaClient, userId: string) {
  return db.enrollment.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: {
      certificate: true,
      course: {
        select: {
          slug: true,
          title: true,
          summary: true,
          category: true,
          durationMinutes: true,
          level: true,
        },
      },
    },
  });
}

export async function myCertificates(db: PrismaClient, userId: string) {
  return db.certificate.findMany({
    where: { enrollment: { userId } },
    orderBy: { issuedAt: "desc" },
    include: { enrollment: { select: { course: { select: { slug: true } } } } },
  });
}

export async function savedCourseIds(db: PrismaClient, userId: string) {
  return (await db.savedCourse.findMany({ where: { userId }, select: { courseId: true } })).map(
    (row) => row.courseId,
  );
}

export async function toggleSavedCourse(db: PrismaClient, userId: string, slug: string) {
  const course = await db.course.findFirst({
    where: { slug, status: "published" },
    select: { id: true },
  });
  if (!course) return null;
  const key = { userId_courseId: { userId, courseId: course.id } };
  if (await db.savedCourse.findUnique({ where: key })) {
    await db.savedCourse.delete({ where: key });
    return false;
  }
  await db.savedCourse.create({ data: { userId, courseId: course.id } });
  return true;
}

export const NOTE_MAX = 2000;

export async function addLessonNote(
  db: PrismaClient,
  userId: string,
  lessonId: string,
  body: string,
) {
  await lessonContext(db, userId, lessonId);
  const text = body.trim().slice(0, NOTE_MAX);
  if (!text) throw new LearnError("invalid");
  return db.lessonNote.create({ data: { userId, lessonId, body: text } });
}

export async function deleteLessonNote(db: PrismaClient, userId: string, noteId: string) {
  await db.lessonNote.deleteMany({ where: { id: noteId, userId } });
}

/** Resources of a lesson: [{ title, url, type, sizeKb }]. Only http(s) and site paths are kept. */
export const lessonResourceSchema = z.object({
  title: z.string().min(1).max(160),
  url: z.string().regex(/^(https:\/\/|\/)/),
  type: z.string().max(20).default("PDF"),
  sizeKb: z.number().int().min(0).optional(),
});

export function parseResources(value: Prisma.JsonValue) {
  const parsed = z.array(lessonResourceSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** Paragraphs of a text lesson (`content.paragraphs`). */
export function lessonParagraphs(value: Prisma.JsonValue | null) {
  const parsed = z.object({ paragraphs: z.array(z.string()) }).safeParse(value);
  return parsed.success ? parsed.data.paragraphs : [];
}
