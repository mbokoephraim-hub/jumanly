/**
 * Resume a lesson video at the second (Learn v2, étape 3). The player sends its position while it
 * plays, when paused and when the page is left; the lesson page starts the video there again.
 * Completion stays in `Enrollment.completedLessons` (« Leçon terminée »).
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { LearnError, lessonContext, rememberLesson } from "./learn";

/** Positions are whole seconds, up to 12 hours (anything longer is not a lesson video). */
const seconds = z.coerce.number().finite().min(0).max(43_200).transform(Math.floor);

export const lessonPositionSchema = z.object({
  lessonId: z.string().trim().min(1).max(40),
  position: seconds,
  duration: seconds.optional(),
});

export type LessonPositionInput = z.infer<typeof lessonPositionSchema>;

/** Below this, the video starts from the beginning. */
export const RESUME_MIN_SECONDS = 5;
/** Closer than this to the end, the video was watched: it starts from the beginning again. */
export const RESUME_END_MARGIN = 10;

/** The second to resume at, or 0 to start from the beginning. */
export function resumeAt(position: number, duration?: number | null) {
  if (position < RESUME_MIN_SECONDS) return 0;
  if (duration && position >= duration - RESUME_END_MARGIN) return 0;
  return position;
}

/**
 * Saves where the learner is in a video lesson they may watch (enrolled, course open by their
 * plan); throws `LearnError` otherwise. Also remembers the lesson as the last one opened.
 */
export async function saveLessonPosition(
  db: PrismaClient,
  userId: string,
  input: LessonPositionInput,
) {
  const ctx = await lessonContext(db, userId, input.lessonId);
  if (ctx.lesson.kind !== "video") throw new LearnError("invalid");
  const duration = input.duration || null;
  const position = duration ? Math.min(input.position, duration) : input.position;
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: ctx.lesson.id } },
    create: {
      userId,
      lessonId: ctx.lesson.id,
      positionSeconds: position,
      durationSeconds: duration,
    },
    update: { positionSeconds: position, ...(duration ? { durationSeconds: duration } : {}) },
  });
  if (ctx.enrollment.lastLessonId !== ctx.lesson.id)
    await rememberLesson(db, userId, ctx.lesson.id);
  return position;
}

/** The saved position of a lesson, ready to resume (0 when there is none). */
export async function lessonResume(db: PrismaClient, userId: string, lessonId: string) {
  const row = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { positionSeconds: true, durationSeconds: true },
  });
  return row ? resumeAt(row.positionSeconds, row.durationSeconds) : 0;
}
