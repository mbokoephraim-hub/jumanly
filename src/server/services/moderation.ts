/**
 * Moderation (partie 10 § 10.7): job review queue and reports of jobs and messages.
 * Called from the admin with a platform role already checked.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

export const reportReasons = [
  "scam",
  "fakeJob",
  "discrimination",
  "harassment",
  "spam",
  "personalData",
  "inappropriate",
  "impersonation",
  "other",
] as const;

export const reportTargets = ["job", "message", "conversation"] as const;

export const reportSchema = z.object({
  targetType: z.enum(reportTargets),
  targetId: z.string().min(1).max(60),
  reason: z.enum(reportReasons),
  details: z.string().trim().max(1000).default(""),
});

/** High priority: scams, payment requests and harassment (`admin.reports.priority.high`). */
export const urgentReasons: string[] = ["scam", "harassment"];

export type ReportResult = "created" | "already" | "notFound";

/** A signed-in person reports a job they can see, or a message of a conversation they are in. */
export async function createReport(
  db: PrismaClient,
  reporterId: string,
  raw: Record<string, unknown>,
): Promise<ReportResult> {
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return "notFound";
  const input = parsed.data;
  if (input.targetType === "job") {
    const job = await db.job.findFirst({
      where: { id: input.targetId, status: { in: ["published", "closed"] } },
    });
    if (!job) return "notFound";
  } else {
    const conversationId =
      input.targetType === "conversation"
        ? input.targetId
        : (
            await db.message.findUnique({
              where: { id: input.targetId },
              select: { conversationId: true },
            })
          )?.conversationId;
    const allowed = conversationId
      ? await db.conversation.findFirst({ where: { id: conversationId, talentUserId: reporterId } })
      : null;
    if (!allowed) return "notFound";
  }
  const existing = await db.report.findUnique({
    where: {
      reporterId_targetType_targetId: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    },
  });
  if (existing) return "already";
  await db.report.create({
    data: { reporterId, ...input, details: input.details || null },
  });
  return "created";
}

export async function moderationQueue(db: PrismaClient) {
  return db.job.findMany({
    where: { status: "pending_review" },
    orderBy: { updatedAt: "asc" },
    include: { organization: { select: { name: true, verifiedAt: true, createdAt: true } } },
  });
}

/** Live jobs, newest first, to take one offline after a report or a check. */
export async function liveJobs(db: PrismaClient) {
  return db.job.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: { organization: { select: { name: true, verifiedAt: true, createdAt: true } } },
  });
}

/** Automatic flags of a job, plus a recent unverified organization (`admin.jobs.autoFlag.*`). */
export function jobFlags(
  job: { moderationFlags: string[]; organization: { verifiedAt: Date | null; createdAt: Date } },
  now = new Date(),
) {
  const recent = job.organization.createdAt > new Date(now.getTime() - 30 * 86_400_000);
  return [...job.moderationFlags, ...(!job.organization.verifiedAt && recent ? ["newOrg"] : [])];
}

export async function approveJob(
  db: PrismaClient,
  actorId: string,
  jobId: string,
  now = new Date(),
) {
  const job = await db.job.findFirst({ where: { id: jobId, status: "pending_review" } });
  if (!job) return null;
  await db.job.update({
    where: { id: job.id },
    data: { status: "published", publishedAt: job.publishedAt ?? now, moderationReason: null },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: "job.approve",
      targetType: "job",
      targetId: job.id,
      organizationId: job.organizationId,
    },
  });
  return job;
}

/** Refuse a job in review, or take a live one offline; the reason is shown to the recruiter. */
export async function refuseJob(db: PrismaClient, actorId: string, jobId: string, reason: string) {
  const job = await db.job.findFirst({
    where: { id: jobId, status: { in: ["pending_review", "published"] } },
  });
  if (!job) return null;
  await db.job.update({
    where: { id: job.id },
    data: { status: "rejected", moderationReason: reason.trim().slice(0, 500) || null },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: "job.refuse",
      targetType: "job",
      targetId: job.id,
      organizationId: job.organizationId,
      metadata: { reason },
    },
  });
  return job;
}

export async function listReports(db: PrismaClient, status: "open" | "closed") {
  return db.report.findMany({
    where: { status: status === "open" ? { in: ["open", "in_progress"] } : "closed" },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}

/**
 * What a moderator needs to judge each report: the job (title, organization), or only the
 * reported message itself, never the rest of the conversation (partie 10 § 10.7).
 */
export async function reportContext(
  db: PrismaClient,
  reports: { targetType: string; targetId: string; reporterId: string }[],
) {
  const ids = (type: string) =>
    reports.filter((report) => report.targetType === type).map((report) => report.targetId);
  const [jobs, messages, conversations, reporters] = await Promise.all([
    db.job.findMany({
      where: { id: { in: ids("job") } },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        organization: { select: { name: true } },
      },
    }),
    db.message.findMany({
      where: { id: { in: ids("message") } },
      select: {
        id: true,
        body: true,
        hiddenAt: true,
        conversation: { select: { organization: { select: { name: true } } } },
      },
    }),
    db.conversation.findMany({
      where: { id: { in: ids("conversation") } },
      select: { id: true, organization: { select: { name: true } } },
    }),
    db.user.findMany({
      where: { id: { in: [...new Set(reports.map((report) => report.reporterId))] } },
      select: { id: true, name: true, email: true },
    }),
  ]);
  return {
    job: new Map(jobs.map((item) => [item.id, item])),
    message: new Map(messages.map((item) => [item.id, item])),
    conversation: new Map(conversations.map((item) => [item.id, item])),
    reporter: new Map(reporters.map((item) => [item.id, item])),
  };
}

export const reportActions = ["dismiss", "hide"] as const;

/**
 * Closes a report. "hide" takes the content down: a job becomes refused (offline), a message is
 * masked. Only the reported message and its conversation are ever read here.
 */
export async function resolveReport(
  db: PrismaClient,
  actorId: string,
  reportId: string,
  action: (typeof reportActions)[number],
) {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.status === "closed") return false;
  if (action === "hide") {
    if (report.targetType === "job") await refuseJob(db, actorId, report.targetId, report.reason);
    if (report.targetType === "message") {
      await db.message.updateMany({
        where: { id: report.targetId },
        data: { hiddenAt: new Date() },
      });
    }
  }
  await db.report.update({
    where: { id: report.id },
    data: { status: "closed", resolution: action, resolvedById: actorId },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: `report.${action}`,
      targetType: report.targetType,
      targetId: report.targetId,
    },
  });
  return true;
}
