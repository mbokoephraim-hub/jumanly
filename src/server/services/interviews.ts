/**
 * Interviews and appointments (E8, `connect.appointments`). The recruiter proposes one to three
 * slots in the application's conversation; the talent picks one, proposes others or declines.
 * Team participants need `hire.collaboration`. Every query is filtered by `organizationId`.
 */
import { z } from "zod";
import type { InterviewMode, Prisma, PrismaClient } from "@/generated/prisma/client";
import { can } from "@/server/entitlements";
import { ensureApplicationConversation } from "./connect";
import { getOrgApplication, hirePermissions, HireError, jobScope, type HireContext } from "./hire";
import { notify } from "./notifications";

export const INTERVIEW_MODES = [
  "video",
  "onsite",
  "audio",
] as const satisfies readonly InterviewMode[];
export const INTERVIEW_DURATIONS = [15, 30, 45, 60, 90] as const;
export const SLOTS_MAX = 3;
/** The video link is shown to the talent this many hours before the interview. */
export const LINK_VISIBLE_HOURS = 24;

const orgSubject = (ctx: HireContext) => ({
  type: "organization" as const,
  id: ctx.organizationId,
});

/** « 2026-10-20T09:30 » typed in the form, read in the organizer's time zone. */
export function slotToDate(value: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Offset of the zone at that moment: format the UTC instant in the zone and compare.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(asUtc));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(asUtc - (local - asUtc));
}

export function validTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const interviewSchema = z
  .object({
    application: z.string().min(1),
    mode: z.enum(INTERVIEW_MODES),
    duration: z.coerce
      .number()
      .int()
      .refine((value) => (INTERVIEW_DURATIONS as readonly number[]).includes(value)),
    slots: z.array(z.string()).min(1).max(SLOTS_MAX),
    timezone: z.string().refine(validTimeZone),
    link: z.union([z.literal(""), z.url().max(300)]).default(""),
    address: z.string().trim().max(300).default(""),
    message: z.string().trim().max(2000).default(""),
    participants: z.array(z.string()).max(10).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "onsite" && !value.address)
      ctx.addIssue({ code: "custom", path: ["address"], message: "required" });
  });

export type ScheduleResult =
  { status: "sent"; interviewId: string } | { status: "locked" | "invalid" | "past" };

/** The recruiter invites a candidate: an invitation message appears in the conversation. */
export async function scheduleInterview(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
  now = new Date(),
): Promise<ScheduleResult> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const subject = orgSubject(ctx);
  if (!(await can(db, subject, "connect.appointments"))) return { status: "locked" };
  const parsed = interviewSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const input = parsed.data;
  const application = await getOrgApplication(db, ctx, input.application);
  if (application.status !== "active") return { status: "invalid" };
  const slots = input.slots
    .filter(Boolean)
    .map((slot) => slotToDate(slot, input.timezone))
    .filter((date): date is Date => date !== null);
  if (slots.length === 0) return { status: "invalid" };
  if (slots.some((slot) => slot <= now)) return { status: "past" };
  const collaboration = await can(db, subject, "hire.collaboration");
  const participants = collaboration
    ? (
        await db.membership.findMany({
          where: {
            organizationId: ctx.organizationId,
            status: "active",
            userId: { in: input.participants.filter((id) => id !== ctx.userId) },
          },
          select: { userId: true },
        })
      ).map((member) => member.userId)
    : [];
  const interview = await db.interview.create({
    data: {
      organizationId: ctx.organizationId,
      applicationId: application.id,
      organizerId: ctx.userId,
      mode: input.mode,
      durationMinutes: input.duration,
      slots: [...slots].sort((a, b) => a.getTime() - b.getTime()),
      timezone: input.timezone,
      link: input.mode === "onsite" ? null : input.link || null,
      address: input.mode === "onsite" ? input.address : null,
      message: input.message || null,
      participantIds: participants,
    },
  });
  const conversation =
    application.conversation ?? (await ensureApplicationConversation(db, application.id));
  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: ctx.userId,
      kind: "invitation",
      body: input.message || application.job.title,
      payload: { interviewId: interview.id },
      createdAt: now,
    },
  });
  await db.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: now } });
  await db.applicationEvent.create({
    data: {
      applicationId: application.id,
      actorId: ctx.userId,
      type: "interview_scheduled",
      payload: { interviewId: interview.id, date: slots[0]!.toISOString() },
    },
  });
  await notify(db, {
    userIds: [application.profile.user.id],
    type: "interviewInvite",
    payload: { company: application.job.organization.name, jobTitle: application.job.title },
    href: `/app/messages/${conversation.id}`,
  });
  await notify(db, {
    userIds: participants,
    type: "interviewTeam",
    payload: { candidateName: application.profile.user.name, jobTitle: application.job.title },
    href: "/app/hire/entretiens",
  });
  return { status: "sent", interviewId: interview.id };
}

const interviewInclude = {
  organizer: { select: { name: true } },
  application: {
    select: {
      id: true,
      job: { select: { id: true, title: true } },
      profile: { select: { user: { select: { id: true, name: true } } } },
      conversation: { select: { id: true } },
    },
  },
} satisfies Prisma.InterviewInclude;

export const interviewFilters = ["mine", "team"] as const;

/** Interviews of the jobs the member may see; « mine »: organized by me or where I take part. */
export async function listInterviews(
  db: PrismaClient,
  ctx: HireContext,
  input: { filter?: (typeof interviewFilters)[number]; jobId?: string; from?: Date },
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const scope = await jobScope(db, ctx);
  const and: Prisma.InterviewWhereInput[] = [
    { organizationId: ctx.organizationId },
    { application: { job: scope, ...(input.jobId ? { jobId: input.jobId } : {}) } },
  ];
  if (input.filter === "mine")
    and.push({ OR: [{ organizerId: ctx.userId }, { participantIds: { has: ctx.userId } }] });
  if (input.from)
    and.push({
      OR: [
        { startsAt: { gte: input.from } },
        { startsAt: null, status: { in: ["pending", "reschedule"] } },
      ],
    });
  const where: Prisma.InterviewWhereInput = { AND: and };
  return db.interview.findMany({
    where,
    orderBy: [{ startsAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: 200,
    include: interviewInclude,
  });
}

async function orgInterview(db: PrismaClient, ctx: HireContext, interviewId: string) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const interview = await db.interview.findFirst({
    where: {
      id: interviewId,
      organizationId: ctx.organizationId,
      application: { job: await jobScope(db, ctx) },
    },
    include: {
      ...interviewInclude,
      organization: { select: { name: true } },
    },
  });
  if (!interview) throw new HireError("notFound");
  return interview;
}

async function systemMessage(
  db: PrismaClient,
  conversationId: string | undefined,
  senderId: string,
  body: string,
  interviewId: string,
) {
  if (!conversationId) return;
  await db.message.create({
    data: { conversationId, senderId, kind: "system", body, payload: { interviewId } },
  });
  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });
}

/** Cancelled by the recruiter: the talent is told, with the message if one was written. */
export async function cancelInterview(
  db: PrismaClient,
  ctx: HireContext,
  interviewId: string,
  reason: string,
) {
  const interview = await orgInterview(db, ctx, interviewId);
  if (["canceled", "done", "no_show", "declined"].includes(interview.status))
    throw new HireError("invalid");
  const text = reason.trim().slice(0, 1000);
  await db.interview.update({
    where: { id: interview.id },
    data: { status: "canceled", cancelReason: text || null },
  });
  if (text)
    await systemMessage(db, interview.application.conversation?.id, ctx.userId, text, interview.id);
  await notify(db, {
    userIds: [interview.application.profile.user.id],
    type: "interviewCanceled",
    payload: { company: interview.organization.name, jobTitle: interview.application.job.title },
    href: interview.application.conversation
      ? `/app/messages/${interview.application.conversation.id}`
      : "/app/jobs/candidatures",
  });
}

/** After the date: done or the candidate did not come. */
export async function closeInterview(
  db: PrismaClient,
  ctx: HireContext,
  interviewId: string,
  outcome: "done" | "no_show",
  now = new Date(),
) {
  const interview = await orgInterview(db, ctx, interviewId);
  if (interview.status !== "confirmed" || !interview.startsAt || interview.startsAt > now)
    throw new HireError("invalid");
  await db.interview.update({ where: { id: interview.id }, data: { status: outcome } });
}

/** New slots from the recruiter (« Reprogrammer »): the talent chooses again. */
export async function rescheduleInterview(
  db: PrismaClient,
  ctx: HireContext,
  interviewId: string,
  rawSlots: string[],
  now = new Date(),
) {
  const interview = await orgInterview(db, ctx, interviewId);
  if (["canceled", "done", "no_show", "declined"].includes(interview.status))
    throw new HireError("invalid");
  const slots = rawSlots
    .filter(Boolean)
    .slice(0, SLOTS_MAX)
    .map((slot) => slotToDate(slot, interview.timezone))
    .filter((date): date is Date => date !== null && date > now);
  if (slots.length === 0) throw new HireError("invalid");
  await db.interview.update({
    where: { id: interview.id },
    data: { status: "pending", slots, startsAt: null, proposedSlots: [] },
  });
  await notify(db, {
    userIds: [interview.application.profile.user.id],
    type: "interviewInvite",
    payload: { company: interview.organization.name, jobTitle: interview.application.job.title },
    href: interview.application.conversation
      ? `/app/messages/${interview.application.conversation.id}`
      : "/app/jobs/candidatures",
  });
}

// ─── Talent side ────────────────────────────────────────────────────────────────

/** An interview of one of the talent's own applications. */
async function talentInterview(db: PrismaClient, userId: string, interviewId: string) {
  const interview = await db.interview.findFirst({
    where: { id: interviewId, application: { profile: { userId } } },
    include: { ...interviewInclude, organization: { select: { name: true } } },
  });
  if (!interview) throw new HireError("notFound");
  return interview;
}

export async function interviewsForConversation(db: PrismaClient, ids: string[]) {
  if (ids.length === 0) return [];
  return db.interview.findMany({ where: { id: { in: ids } } });
}

function teamOf(interview: { organizerId: string; participantIds: string[] }) {
  return [interview.organizerId, ...interview.participantIds];
}

export type TalentAnswer =
  | { answer: "accept"; slot: string }
  | { answer: "propose"; slots: string[]; message: string }
  | { answer: "decline"; message: string };

/** The talent confirms a slot, asks for other times, or declines. */
export async function answerInterview(
  db: PrismaClient,
  userId: string,
  interviewId: string,
  input: TalentAnswer,
  now = new Date(),
) {
  const interview = await talentInterview(db, userId, interviewId);
  if (!["pending", "reschedule", "confirmed"].includes(interview.status))
    throw new HireError("invalid");
  const conversationId = interview.application.conversation?.id;
  const payload = {
    candidateName: interview.application.profile.user.name,
    jobTitle: interview.application.job.title,
  };
  if (input.answer === "accept") {
    if (interview.status !== "pending") throw new HireError("invalid");
    const slot = interview.slots.find((item) => item.toISOString() === input.slot);
    if (!slot || slot <= now) throw new HireError("invalid");
    await db.interview.update({
      where: { id: interview.id },
      data: { status: "confirmed", startsAt: slot },
    });
    await notify(db, {
      userIds: teamOf(interview),
      type: "interviewConfirmed",
      payload,
      href: "/app/hire/entretiens",
    });
    return;
  }
  if (input.answer === "propose") {
    const slots = input.slots
      .filter(Boolean)
      .slice(0, SLOTS_MAX)
      .map((slot) => slotToDate(slot, interview.timezone))
      .filter((date): date is Date => date !== null && date > now);
    if (slots.length === 0) throw new HireError("invalid");
    await db.interview.update({
      where: { id: interview.id },
      data: { status: "reschedule", proposedSlots: slots, startsAt: null },
    });
    const message = input.message.trim().slice(0, 1000);
    if (message) await systemMessage(db, conversationId, userId, message, interview.id);
    await notify(db, {
      userIds: teamOf(interview),
      type: "interviewReschedule",
      payload,
      href: "/app/hire/entretiens",
    });
    return;
  }
  await db.interview.update({ where: { id: interview.id }, data: { status: "declined" } });
  const message = input.message.trim().slice(0, 1000);
  if (message) await systemMessage(db, conversationId, userId, message, interview.id);
  await notify(db, {
    userIds: teamOf(interview),
    type: "interviewDeclined",
    payload,
    href: "/app/hire/entretiens",
  });
}

/** Upcoming confirmed interviews of a talent (dashboard). */
export async function upcomingTalentInterviews(db: PrismaClient, userId: string, now = new Date()) {
  return db.interview.findMany({
    where: {
      application: { profile: { userId } },
      status: "confirmed",
      startsAt: { gte: now },
    },
    orderBy: { startsAt: "asc" },
    take: 3,
    include: {
      organizer: { select: { name: true } },
      organization: { select: { name: true } },
      application: { select: { conversation: { select: { id: true } } } },
    },
  });
}

/** Interviews to come for the Hire dashboard and its weekly count. */
export async function upcomingOrgInterviews(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const week = new Date(now.getTime() + 7 * 86_400_000);
  const scope = await jobScope(db, ctx);
  const confirmed = {
    organizationId: ctx.organizationId,
    application: { job: scope },
    status: "confirmed" as const,
  };
  const [next, thisWeek, total] = await Promise.all([
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        application: { job: scope },
        status: "confirmed",
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: interviewInclude,
    }),
    db.interview.count({
      where: {
        organizationId: ctx.organizationId,
        application: { job: scope },
        status: "confirmed",
        startsAt: { gte: now, lt: week },
      },
    }),
    db.interview.count({ where: { ...confirmed, startsAt: { gte: now } } }),
  ]);
  return { next, thisWeek, total };
}
