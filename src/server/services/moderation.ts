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
  // Le Fil (Modèle B, lot B3): « Fausse information ».
  "misinformation",
  "other",
] as const;

/**
 * `profile`: a talent reported by another talent (Connexions, lot 6); the id is the profile.
 * `post`: a post or an answer of the Fil (Modèle B, lot B3).
 */
export const reportTargets = ["job", "message", "conversation", "profile", "post"] as const;

export const reportSchema = z.object({
  targetType: z.enum(reportTargets),
  targetId: z.string().min(1).max(60),
  reason: z.enum(reportReasons),
  details: z.string().trim().max(1000).default(""),
});

/** High priority: scams, payment requests and harassment (`admin.reports.priority.high`). */
export const urgentReasons: string[] = ["scam", "harassment"];

/**
 * Gravity of a report (Admin v2, étape 7): 2 for scams and harassment, 1 for what can hurt a
 * person or mislead (fake job, discrimination, personal data, impersonation), 0 otherwise.
 */
export function reportSeverity(reason: string) {
  if (urgentReasons.includes(reason)) return 2;
  return ["fakeJob", "discrimination", "personalData", "impersonation"].includes(reason) ? 1 : 0;
}

/** The queue order: the most serious first, then the oldest. */
export function sortReports<T extends { reason: string; createdAt: Date }>(reports: T[]) {
  return [...reports].sort(
    (a, b) =>
      reportSeverity(b.reason) - reportSeverity(a.reason) ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

/** Gravity of the automatic flags of a job: payment requests and discrimination weigh most. */
export function jobSeverity(flags: string[]) {
  return flags.reduce(
    (sum, flag) => sum + (flag === "payment" || flag === "discrimination" ? 2 : 1),
    0,
  );
}

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
  } else if (input.targetType === "post") {
    const post = await db.feedPost.findFirst({
      where: { id: input.targetId, hiddenAt: null },
      select: { authorId: true, organizationId: true },
    });
    // One's own post is deleted, not reported.
    if (!post || (post.authorId === reporterId && !post.organizationId)) return "notFound";
  } else if (input.targetType === "profile") {
    // Only someone the reporter is (or was) in touch with through Connexions.
    const profile = await db.talentProfile.findUnique({
      where: { id: input.targetId },
      select: { userId: true },
    });
    const link = profile
      ? await db.connection.findFirst({
          where: {
            OR: [
              { requesterId: reporterId, addresseeId: profile.userId },
              { requesterId: profile.userId, addresseeId: reporterId },
            ],
          },
        })
      : null;
    if (!link) return "notFound";
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
      ? await db.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { talentUserId: reporterId },
              { kind: "peer", participants: { some: { userId: reporterId } } },
              // Recruteur lot 6: a member of the organization of the conversation.
              {
                kind: { not: "peer" },
                organization: {
                  memberships: { some: { userId: reporterId, status: "active" } },
                },
              },
            ],
          },
        })
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

/** Jobs waiting for a moderator: the most serious flags first, then the oldest. */
export async function moderationQueue(db: PrismaClient, now = new Date()) {
  const jobs = await db.job.findMany({
    where: { status: "pending_review" },
    orderBy: { updatedAt: "asc" },
    include: { organization: { select: { name: true, verifiedAt: true, createdAt: true } } },
  });
  return jobs
    .map((job, index) => ({ job, index, severity: jobSeverity(jobFlags(job, now)) }))
    .sort((a, b) => b.severity - a.severity || a.index - b.index)
    .map((item) => item.job);
}

/** Jobs sent back to their recruiter for correction, waiting for a new version. */
export async function changesRequestedJobs(db: PrismaClient) {
  return db.job.findMany({
    where: { status: "changes_requested" },
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
    data: {
      status: "published",
      publishedAt: job.publishedAt ?? now,
      moderationReason: null,
      moderationChecks: [],
    },
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

export const correctionPoints = ["real", "noPayment", "noDiscrimination", "knockout"] as const;

export const changesSchema = z.object({
  job: z.string().min(1).max(60),
  reason: z.string().trim().min(3).max(500),
  points: z.array(z.enum(correctionPoints)).max(correctionPoints.length).default([]),
});

/**
 * « Demander une correction » (Admin v2, étape 7): a job in review goes back to its recruiter
 * with the moderator's message and the points to correct; published again, it returns to review.
 */
export async function requestJobChanges(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof changesSchema>,
) {
  const job = await db.job.findFirst({ where: { id: input.job, status: "pending_review" } });
  if (!job) return null;
  const points = [...new Set(input.points)];
  await db.job.update({
    where: { id: job.id },
    data: {
      status: "changes_requested",
      moderationReason: input.reason,
      moderationChecks: points,
    },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: "job.changes",
      targetType: "job",
      targetId: job.id,
      organizationId: job.organizationId,
      metadata: { reason: input.reason, points },
    },
  });
  return job;
}

export async function listReports(db: PrismaClient, status: "open" | "closed") {
  const reports = await db.report.findMany({
    where: { status: status === "open" ? { in: ["open", "in_progress"] } : "closed" },
    orderBy: { createdAt: status === "open" ? "asc" : "desc" },
    take: 200,
  });
  return status === "open" ? sortReports(reports) : reports;
}

/** How many reports in each status, for the tabs. */
export async function reportCounts(db: PrismaClient) {
  const rows = await db.report.groupBy({ by: ["status"], _count: { _all: true } });
  const count = (status: string) => rows.find((row) => row.status === status)?._count._all ?? 0;
  return { open: count("open"), inProgress: count("in_progress"), closed: count("closed") };
}

/**
 * What a moderator needs to judge each report: the job (title, organization, text), or the
 * reported message; its neighbours are read only on request (`messageContext`), and logged.
 */
export async function reportContext(
  db: PrismaClient,
  reports: { targetType: string; targetId: string; reporterId: string }[],
) {
  const ids = (type: string) =>
    reports.filter((report) => report.targetType === type).map((report) => report.targetId);
  const [jobs, messages, conversations, reporters, posts] = await Promise.all([
    db.job.findMany({
      where: { id: { in: ids("job") } },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        description: true,
        requirements: true,
        benefits: true,
        city: true,
        createdById: true,
        organization: { select: { name: true } },
      },
    }),
    db.message.findMany({
      where: { id: { in: ids("message") } },
      select: {
        id: true,
        body: true,
        hiddenAt: true,
        senderId: true,
        createdAt: true,
        conversationId: true,
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
    db.feedPost.findMany({
      where: { id: { in: ids("post") } },
      select: {
        id: true,
        body: true,
        imageUrl: true,
        hiddenAt: true,
        parentId: true,
        author: { select: { name: true } },
        organization: { select: { name: true } },
      },
    }),
  ]);
  return {
    post: new Map(posts.map((item) => [item.id, item])),
    job: new Map(jobs.map((item) => [item.id, item])),
    message: new Map(messages.map((item) => [item.id, item])),
    conversation: new Map(conversations.map((item) => [item.id, item])),
    reporter: new Map(reporters.map((item) => [item.id, item])),
  };
}

/** Messages read around a reported one: two before, two after, never more. */
export const CONTEXT_AROUND = 2;

/**
 * The immediate context of a reported message (Admin v2, étape 7): the messages just before and
 * after it in the same conversation, each read logged in the audit log.
 */
export async function messageContext(db: PrismaClient, actorId: string, reportId: string) {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.targetType !== "message") return null;
  const message = await db.message.findUnique({ where: { id: report.targetId } });
  if (!message) return null;
  const conversation = await db.conversation.findUnique({
    where: { id: message.conversationId },
    select: { talentUserId: true },
  });
  const select = { id: true, body: true, senderId: true, createdAt: true, hiddenAt: true };
  const [before, after] = await Promise.all([
    db.message.findMany({
      where: { conversationId: message.conversationId, createdAt: { lt: message.createdAt } },
      orderBy: { createdAt: "desc" },
      take: CONTEXT_AROUND,
      select,
    }),
    db.message.findMany({
      where: { conversationId: message.conversationId, createdAt: { gt: message.createdAt } },
      orderBy: { createdAt: "asc" },
      take: CONTEXT_AROUND,
      select,
    }),
  ]);
  await db.auditLog.create({
    data: {
      actorId,
      action: "report.context",
      targetType: "message",
      targetId: message.id,
      metadata: { reportId, messages: before.length + after.length },
    },
  });
  const side = (senderId: string | null) =>
    senderId && senderId === conversation?.talentUserId ? ("talent" as const) : ("org" as const);
  return [...before.reverse(), message, ...after].map((item) => ({
    id: item.id,
    body: item.body,
    createdAt: item.createdAt,
    hiddenAt: item.hiddenAt,
    side: side(item.senderId),
    reported: item.id === message.id,
  }));
}

/** The author of the reported content: the sender of a message, the creator of a job. */
export async function reportAuthor(
  db: PrismaClient,
  report: { targetType: string; targetId: string },
) {
  const id =
    report.targetType === "message"
      ? (
          await db.message.findUnique({
            where: { id: report.targetId },
            select: { senderId: true },
          })
        )?.senderId
      : report.targetType === "profile"
        ? (
            await db.talentProfile.findUnique({
              where: { id: report.targetId },
              select: { userId: true },
            })
          )?.userId
        : report.targetType === "post"
          ? (
              await db.feedPost.findUnique({
                where: { id: report.targetId },
                select: { authorId: true },
              })
            )?.authorId
          : report.targetType === "job"
            ? (
                await db.job.findUnique({
                  where: { id: report.targetId },
                  select: { createdById: true },
                })
              )?.createdById
            : null;
  return id
    ? db.user.findUnique({
        where: { id },
        select: { id: true, name: true, firstName: true, email: true, platformRole: true },
      })
    : null;
}

export const reportActions = ["dismiss", "hide", "warn"] as const;

export const reportNoteSchema = z.object({
  report: z.string().min(1).max(60),
  note: z.string().trim().min(3).max(1000),
});

/** An internal note on a report: kept in the audit log, the report moves to « En cours ». */
export async function addReportNote(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof reportNoteSchema>,
) {
  const report = await db.report.findUnique({ where: { id: input.report } });
  if (!report || report.status === "closed") return false;
  if (report.status === "open")
    await db.report.update({ where: { id: report.id }, data: { status: "in_progress" } });
  await db.auditLog.create({
    data: {
      actorId,
      action: "report.note",
      targetType: "report",
      targetId: report.id,
      metadata: { reason: input.note },
    },
  });
  return true;
}

/** Internal notes and decisions of a report, oldest first. */
export async function reportNotes(db: PrismaClient, reportId: string) {
  const rows = await db.auditLog.findMany({
    where: { targetType: "report", targetId: reportId },
    orderBy: { createdAt: "asc" },
    select: { id: true, action: true, metadata: true, createdAt: true, actorId: true },
  });
  const actors = await db.user.findMany({
    where: { id: { in: [...new Set(rows.flatMap((row) => (row.actorId ? [row.actorId] : [])))] } },
    select: { id: true, name: true },
  });
  return rows.map((row) => ({
    ...row,
    actor: actors.find((actor) => actor.id === row.actorId)?.name ?? null,
    note:
      row.metadata && typeof row.metadata === "object" && "reason" in row.metadata
        ? String(row.metadata.reason)
        : "",
  }));
}

export const closeReportSchema = z.object({
  report: z.string().min(1).max(60),
  decision: z.enum(reportActions),
  reason: z.string().trim().min(3).max(1000),
});

/**
 * Closes a report with a decision and a reason (Admin v2, étape 7), with every other open report
 * on the same content. "hide" takes the content down (a job is refused, a message masked);
 * "warn" keeps it and warns its author. Returns who reported, to tell them it is done.
 */
export async function closeReport(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof closeReportSchema>,
  now = new Date(),
) {
  const report = await db.report.findUnique({ where: { id: input.report } });
  if (!report || report.status === "closed") return null;
  if (input.decision === "hide") {
    if (report.targetType === "job") await refuseJob(db, actorId, report.targetId, input.reason);
    if (report.targetType === "post") {
      await db.feedPost.updateMany({
        where: { id: report.targetId, hiddenAt: null },
        data: { hiddenAt: now },
      });
    }
    if (report.targetType === "message") {
      await db.message.updateMany({
        where: { id: report.targetId, hiddenAt: null },
        data: { hiddenAt: now },
      });
    }
  }
  const same = await db.report.findMany({
    where: {
      targetType: report.targetType,
      targetId: report.targetId,
      status: { in: ["open", "in_progress"] },
    },
    select: { id: true, reporterId: true },
  });
  await db.report.updateMany({
    where: { id: { in: same.map((item) => item.id) } },
    data: {
      status: "closed",
      resolution: input.decision,
      resolutionReason: input.reason,
      resolvedById: actorId,
      closedAt: now,
    },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: `report.${input.decision}`,
      targetType: "report",
      targetId: report.id,
      metadata: {
        reason: input.reason,
        content: `${report.targetType}:${report.targetId}`,
        reports: same.length,
      },
    },
  });
  return {
    report,
    reporterIds: [...new Set(same.map((item) => item.reporterId))],
    author: input.decision === "warn" ? await reportAuthor(db, report) : null,
  };
}
