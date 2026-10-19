/**
 * Drafts of the staged application (docs/ux-mobile-talent, prompt 4, screens 09-12): what the
 * talent chose so far, saved on the server at each step, so that a cut connection or a « Quitter »
 * loses nothing. Private to the talent; removed when the application is sent.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { ownRefs, type AttachmentRef } from "./application-attachments";

/** Steps of the form, in order. « Questions » does not exist yet: offers carry no questions. */
export const applySteps = ["cv", "lettre", "verification"] as const;
export type ApplyStep = (typeof applySteps)[number];

export function applyStepOf(value: unknown): ApplyStep {
  return applySteps.includes(value as ApplyStep) ? (value as ApplyStep) : "cv";
}

export async function getApplicationDraft(db: PrismaClient, userId: string, jobId: string) {
  return db.applicationDraft.findUnique({ where: { userId_jobId: { userId, jobId } } });
}

/**
 * Saves one step. Only the fields of that step are written; a CV that is not the talent's own is
 * refused (kept as not chosen).
 */
export async function saveApplicationDraft(
  db: PrismaClient,
  input: {
    userId: string;
    jobId: string;
    step: ApplyStep;
    cv?: { documentId: string | null; profileOnly: boolean };
    coverLetter?: string;
    attachments?: AttachmentRef[];
  },
) {
  let cv = input.cv;
  if (cv?.documentId) {
    const owned = await db.document.findFirst({
      where: { id: cv.documentId, kind: "cv", profile: { userId: input.userId } },
      select: { id: true },
    });
    if (!owned) cv = { documentId: null, profileOnly: false };
  }
  const attachments = input.attachments && (await ownRefs(db, input.userId, input.attachments));
  const data = {
    step: input.step,
    ...(attachments && { attachments }),
    ...(cv && { cvDocumentId: cv.documentId, profileOnly: cv.profileOnly }),
    ...(input.coverLetter !== undefined && { coverLetter: input.coverLetter.trim() }),
  };
  return db.applicationDraft.upsert({
    where: { userId_jobId: { userId: input.userId, jobId: input.jobId } },
    update: data,
    create: { userId: input.userId, jobId: input.jobId, ...data },
  });
}

/** Drafts of open offers the talent has not applied to yet, newest first (Pour moi, Suivi). */
export async function openDrafts(db: PrismaClient, userId: string, now = new Date()) {
  return db.applicationDraft.findMany({
    where: {
      userId,
      job: {
        status: "published",
        OR: [{ closesAt: null }, { closesAt: { gt: now } }],
        applications: { none: { profile: { userId } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      step: true,
      updatedAt: true,
      job: { select: { slug: true, title: true, organization: { select: { name: true } } } },
    },
  });
}
