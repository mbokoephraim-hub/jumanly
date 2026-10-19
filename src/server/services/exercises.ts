/**
 * Exercises to hand in (planche talent-3, « Exercice à rendre »): a PDF or a photo of four
 * megabytes at most, kept in the private storage, or one of the learner's CVs. Handing it in
 * completes the lesson; Orbi may reread it, it never does the exercise for the learner.
 */
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { sniffDocumentType, type FileStorage } from "@/server/storage";
import { completeLesson, LearnError, lessonContext } from "./learn";

// The planche says 5 Mo; a request to the host stops at 4.5 Mo, so 4 Mo (decision of lot 5).
export const EXERCISE_MAX_BYTES = 4 * 1024 * 1024;

export type ExerciseInput = { file: { name: string; bytes: Uint8Array } } | { documentId: string };

export async function submitExercise(
  db: PrismaClient,
  storage: FileStorage,
  userId: string,
  lessonId: string,
  input: ExerciseInput,
) {
  const ctx = await lessonContext(db, userId, lessonId);
  if (ctx.lesson.kind !== "exercise") throw new LearnError("invalid");
  if ("file" in input) {
    const { bytes, name } = input.file;
    if (bytes.byteLength === 0 || bytes.byteLength > EXERCISE_MAX_BYTES)
      throw new LearnError("invalid");
    const type = sniffDocumentType(bytes);
    if (!type) throw new LearnError("invalid");
    const storageKey = `exercises/${userId}/${randomUUID()}`;
    await storage.put(storageKey, { contentType: type, bytes });
    await db.exerciseSubmission.create({
      data: {
        userId,
        lessonId,
        storageKey,
        fileName: name.slice(0, 160) || null,
        size: bytes.byteLength,
      },
    });
  } else {
    const document = await db.document.findFirst({
      where: { id: input.documentId, kind: "cv", profile: { userId } },
      select: { id: true, title: true },
    });
    if (!document) throw new LearnError("invalid");
    await db.exerciseSubmission.create({
      data: { userId, lessonId, documentId: document.id, fileName: document.title.slice(0, 160) },
    });
  }
  return completeLesson(db, userId, lessonId);
}

/** What the learner handed in for a lesson, the latest first. */
export async function exerciseSubmissions(db: PrismaClient, userId: string, lessonId: string) {
  return db.exerciseSubmission.findMany({
    where: { userId, lessonId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, fileName: true, size: true, documentId: true, createdAt: true },
  });
}
