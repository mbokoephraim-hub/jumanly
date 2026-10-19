/**
 * Applications (docs/specifications.md, partie 06 § 6.3).
 *
 * Golden rule n° 1: applying is always free. Nothing in this file reads a plan, an entitlement or a
 * quota, and a test checks it stays that way (tests/db/applications.test.ts). Free profiles are
 * treated like every other.
 */
import { freezeApplicationMatch } from "@/server/matching/service";
import type { Prisma, PrismaClient, StageKind } from "@/generated/prisma/client";
import { snapshotAttachments, type AttachmentRef } from "./application-attachments";
import { isJobOpen } from "./jobs";
import { reportError } from "@/server/observability";

/** Stages every job starts with; the recruiter edits them in Hire (E4). */
export const defaultStages: { kind: StageKind; name: string }[] = [
  { kind: "new", name: "Nouvelles candidatures" },
  { kind: "screening", name: "Présélection" },
  { kind: "interview", name: "Entretien" },
  { kind: "offer", name: "Proposition" },
  { kind: "hired", name: "Recruté" },
  { kind: "rejected", name: "Non retenu" },
];

export async function ensureStages(db: PrismaClient | Prisma.TransactionClient, jobId: string) {
  const count = await db.pipelineStage.count({ where: { jobId } });
  if (count === 0) {
    await db.pipelineStage.createMany({
      data: defaultStages.map((stage, order) => ({ jobId, order, ...stage })),
      skipDuplicates: true,
    });
  }
  return db.pipelineStage.findMany({ where: { jobId }, orderBy: { order: "asc" } });
}

export type ApplyResult =
  | { status: "applied"; applicationId: string }
  | { status: "already"; applicationId: string }
  | { status: "closed" }
  | { status: "notFound" };

/**
 * Sends an application: the CV is copied as it is now (later edits do not change what the
 * recruiter received). Only checks that the job exists and is open, and that the person has not
 * already applied.
 */
export async function applyToJob(
  db: PrismaClient,
  input: {
    userId: string;
    jobSlug: string;
    cvDocumentId?: string | null;
    coverLetter?: string | null;
    attachments?: AttachmentRef[];
  },
  now = new Date(),
): Promise<ApplyResult> {
  const job = await db.job.findUnique({ where: { slug: input.jobSlug } });
  if (!job || job.status === "draft" || job.status === "archived") return { status: "notFound" };
  const profile = await db.talentProfile.upsert({
    where: { userId: input.userId },
    update: {},
    create: { userId: input.userId },
  });
  const existing = await db.application.findUnique({
    where: { jobId_profileId: { jobId: job.id, profileId: profile.id } },
  });
  if (existing) return { status: "already", applicationId: existing.id };
  if (!isJobOpen(job, now)) return { status: "closed" };

  const cv = input.cvDocumentId
    ? await db.document.findFirst({
        where: { id: input.cvDocumentId, profileId: profile.id, kind: "cv" },
      })
    : null;
  const attachments = await snapshotAttachments(db, input.userId, input.attachments ?? []);
  const stages = await ensureStages(db, job.id);
  const first = stages.find((stage) => stage.kind === "new") ?? stages[0]!;
  try {
    const application = await db.application.create({
      data: {
        jobId: job.id,
        profileId: profile.id,
        stageId: first.id,
        coverLetter: input.coverLetter?.trim() || null,
        attachments: attachments as Prisma.InputJsonValue,
        cvSnapshot: cv
          ? {
              documentId: cv.id,
              title: cv.title,
              templateId: cv.templateId,
              content: cv.content as Prisma.InputJsonValue,
              ...(cv.style ? { style: cv.style as Prisma.InputJsonValue } : {}),
            }
          : undefined,
        events: { create: { actorId: input.userId, type: "submitted" } },
      },
    });
    // The score shown at that moment is kept with the application; applying never waits on it.
    await freezeApplicationMatch(db, application.id, now).catch((error) => reportError(error));
    // The draft of the staged form has done its job (docs/ux-mobile-talent, prompt 4).
    await db.applicationDraft.deleteMany({ where: { userId: input.userId, jobId: job.id } });
    return { status: "applied", applicationId: application.id };
  } catch (error) {
    // Two clicks at once: the unique (job, profile) pair keeps a single application.
    const again = await db.application.findUnique({
      where: { jobId_profileId: { jobId: job.id, profileId: profile.id } },
    });
    if (again) return { status: "already", applicationId: again.id };
    throw error;
  }
}

export async function withdrawApplication(db: PrismaClient, userId: string, applicationId: string) {
  const application = await db.application.findFirst({
    where: { id: applicationId, profile: { userId }, status: "active" },
  });
  if (!application) return false;
  await db.application.update({
    where: { id: application.id },
    data: { status: "withdrawn", events: { create: { actorId: userId, type: "withdrawn" } } },
  });
  return true;
}

/** Status shown to the talent (texts `talent.jobs.applications.status.*`). */
export type TalentApplicationStatus =
  | "sent"
  | "viewed"
  | "shortlisted"
  | "test"
  | "interview"
  | "offer"
  | "hired"
  | "notSelected"
  | "withdrawn"
  | "jobClosed";

export function talentStatus(
  application: {
    status: string;
    viewedAt: Date | null;
    stage: { kind: StageKind };
    job: { status: string; closesAt: Date | null };
  },
  now = new Date(),
): TalentApplicationStatus {
  if (application.status === "withdrawn") return "withdrawn";
  if (application.status === "hired" || application.stage.kind === "hired") return "hired";
  if (application.status === "rejected" || application.stage.kind === "rejected")
    return "notSelected";
  switch (application.stage.kind) {
    case "screening":
      return "shortlisted";
    case "test":
      return "test";
    case "interview":
      return "interview";
    case "offer":
      return "offer";
    default:
      if (!isJobOpen(application.job, now)) return "jobClosed";
      return application.viewedAt ? "viewed" : "sent";
  }
}

/** Finished from the talent's point of view: nothing more will happen. */
export function isClosedStatus(status: TalentApplicationStatus) {
  return ["hired", "notSelected", "withdrawn", "jobClosed"].includes(status);
}

/** Events a talent sees in the history of an application. */
export const talentEventTypes = [
  "submitted",
  "viewed",
  "stage_changed",
  "decision",
  "withdrawn",
] as const;

export async function listApplications(db: PrismaClient, userId: string) {
  return db.application.findMany({
    where: { profile: { userId } },
    orderBy: { createdAt: "desc" },
    include: {
      stage: { select: { kind: true, name: true } },
      // Notes and internal reasons of the recruiting team are never shown to the talent.
      events: { where: { type: { in: [...talentEventTypes] } }, orderBy: { createdAt: "asc" } },
      job: {
        select: {
          slug: true,
          title: true,
          city: true,
          status: true,
          closesAt: true,
          contractType: true,
          remote: true,
          organization: { select: { name: true } },
          // Steps the recruiter defined, for the tracker of « Mes candidatures ».
          stages: { select: { kind: true, name: true, order: true }, orderBy: { order: "asc" } },
        },
      },
      conversation: { select: { id: true, _count: { select: { messages: true } } } },
      interviews: {
        where: { status: "confirmed", startsAt: { not: null } },
        orderBy: { startsAt: "asc" },
        select: { id: true, mode: true, durationMinutes: true, startsAt: true, timezone: true },
      },
    },
  });
}

/**
 * Steps shown to the talent for one application: sent, read by the recruiter, then the stages the
 * recruiter defined (without the first inbox stage and the final decision). Each step is done,
 * current or still to come.
 */
export type TrackerStep = {
  key: string;
  status: TalentApplicationStatus;
  state: "done" | "current" | "next";
};

const trackedKinds: Partial<Record<StageKind, TalentApplicationStatus>> = {
  screening: "shortlisted",
  test: "test",
  interview: "interview",
  offer: "offer",
};

export function applicationTracker(
  application: {
    viewedAt: Date | null;
    stage: { kind: StageKind };
    job: { stages: { kind: StageKind; name: string; order: number }[] };
  },
  status: TalentApplicationStatus,
): TrackerStep[] {
  const stages = application.job.stages.filter((stage) => stage.kind in trackedKinds);
  const kinds = stages.length
    ? stages.map((stage) => stage.kind)
    : (["screening", "interview", "offer"] as StageKind[]);
  const steps: { key: string; status: TalentApplicationStatus; kind?: StageKind }[] = [
    { key: "sent", status: "sent" },
    { key: "viewed", status: "viewed" },
    ...kinds.map((kind, index) => ({ key: `${kind}-${index}`, status: trackedKinds[kind]!, kind })),
  ];
  const currentKind = application.stage.kind;
  let current = steps.findIndex((step) => step.kind === currentKind);
  if (current < 0) {
    if (currentKind === "hired") current = steps.length - 1;
    else current = application.viewedAt || currentKind !== "new" ? 1 : 0;
  }
  const finished = status === "hired";
  return steps.map((step, index) => ({
    key: step.key,
    status: step.status,
    state: index < current || finished ? "done" : index === current ? "current" : "next",
  }));
}

export type TalentApplication = Awaited<ReturnType<typeof listApplications>>[number];

export async function toggleSavedJob(db: PrismaClient, userId: string, jobSlug: string) {
  const job = await db.job.findUnique({ where: { slug: jobSlug }, select: { id: true } });
  if (!job) return null;
  const key = { userId_jobId: { userId, jobId: job.id } };
  const existing = await db.savedJob.findUnique({ where: key });
  if (existing) {
    await db.savedJob.delete({ where: key });
    return false;
  }
  await db.savedJob.create({ data: { userId, jobId: job.id } });
  return true;
}
