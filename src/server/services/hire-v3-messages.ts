/**
 * « Messages » of the recruiter's web app v3 (lot 5, `V.messages` of the prototype, 26-28): the
 * candidates' conversations (as the organization) and the team's, in one place. Every read goes
 * through the organization (golden rule n° 6) and the offers the member may see (`jobScope`).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { sentAttachments } from "./application-attachments";
import { ConnectError, markRead } from "./connect";
import { hirePermissions, jobScope, type HireContext } from "./hire";
import { isOnline, receiptOf } from "./hire-messaging";
import { rhMessages, teamThread } from "./hire-phone-messages";

export const MESSAGE_TABS = ["all", "candidates", "team"] as const;
export type MessageTab = (typeof MESSAGE_TABS)[number];

/** The list: candidates and colleagues (the member's own relations stay on the phone). */
export async function messagesInbox(db: PrismaClient, ctx: HireContext) {
  const rows = (await rhMessages(db, ctx)).filter((row) => row.tab !== "reseau");
  const unread = rows.filter((row) => row.unread > 0);
  return {
    rows,
    unreadConversations: unread.length,
    unreadMessages: unread.reduce((sum, row) => sum + row.unread, 0),
  };
}

export type MessagesInbox = Awaited<ReturnType<typeof messagesInbox>>;

/** A candidate's conversation, as the organization, with what the side panel shows. */
export async function candidateConversation(
  db: PrismaClient,
  ctx: HireContext,
  conversationId: string,
  now = new Date(),
) {
  const scope = await jobScope(db, ctx);
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId: ctx.organizationId,
      kind: { not: "peer" },
      OR: [{ applicationId: null }, { application: { job: scope } }],
    },
    select: {
      id: true,
      blockedAt: true,
      talentUserId: true,
      participants: { select: { userId: true, lastReadAt: true } },
      messages: {
        where: { hiddenAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        orderBy: { createdAt: "asc" },
        take: 300,
        select: { id: true, senderId: true, body: true, kind: true, createdAt: true },
      },
      application: {
        select: {
          id: true,
          matchScore: true,
          cvSnapshot: true,
          coverLetter: true,
          attachments: true,
          createdAt: true,
          job: { select: { id: true, title: true } },
          stage: { select: { name: true, kind: true } },
          interviews: {
            where: { status: "confirmed", startsAt: { gt: now } },
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true, mode: true },
          },
          testInvites: {
            orderBy: { sentAt: "desc" },
            take: 1,
            select: { score: true },
          },
        },
      },
    },
  });
  if (!conversation) throw new ConnectError("notFound");
  const [viewer, talent] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: { showPresence: true, readReceipts: true },
    }),
    db.user.findUniqueOrThrow({
      where: { id: conversation.talentUserId },
      select: {
        id: true,
        name: true,
        lastSeenAt: true,
        showPresence: true,
        readReceipts: true,
        talentProfile: { select: { headline: true } },
      },
    }),
  ]);
  await markRead(db, { userId: ctx.userId, hire: ctx }, conversation.id, now);
  const talentRead =
    conversation.participants.find((p) => p.userId === conversation.talentUserId)?.lastReadAt ??
    null;
  const lastOrg =
    [...conversation.messages].reverse().find((m) => m.senderId !== conversation.talentUserId) ??
    null;
  const application = conversation.application;
  const documents = application
    ? (application.cvSnapshot ? 1 : 0) +
      (application.coverLetter ? 1 : 0) +
      sentAttachments(application.attachments).length
    : 0;
  return {
    id: conversation.id,
    blocked: Boolean(conversation.blockedAt),
    canWrite: hirePermissions(ctx.role).manage && !conversation.blockedAt,
    person: {
      id: talent.id,
      name: talent.name,
      headline: talent.talentProfile?.headline ?? null,
      online: isOnline(talent, viewer, now),
    },
    application: application
      ? {
          id: application.id,
          job: application.job.title,
          stage: application.stage.name,
          stageKind: application.stage.kind,
          score: application.matchScore,
          test: application.testInvites[0]?.score ?? null,
          documents,
          interview: application.interviews[0]?.startsAt ?? null,
          interviewMode: application.interviews[0]?.mode ?? null,
          appliedAt: application.createdAt,
        }
      : null,
    receipt: receiptOf(
      lastOrg,
      { readReceipts: talent.readReceipts, lastReadAt: talentRead },
      viewer,
    ),
    lastOrgId: lastOrg?.id ?? null,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      mine: m.senderId !== conversation.talentUserId,
      body: m.body,
      kind: m.kind,
      at: m.createdAt,
    })),
  };
}

export type CandidateConversation = Awaited<ReturnType<typeof candidateConversation>>;

/** A colleague's conversation, with what the side panel shows. */
export async function colleagueConversation(db: PrismaClient, ctx: HireContext, threadId: string) {
  const thread = await teamThread(db, ctx, threadId);
  // The next interview the colleague takes part in, in this organization.
  const next = await db.interview.findFirst({
    where: {
      organizationId: ctx.organizationId,
      status: "confirmed",
      startsAt: { gt: new Date() },
      OR: [{ organizerId: thread.other.id }, { participantIds: { has: thread.other.id } }],
    },
    orderBy: { startsAt: "asc" },
    select: {
      startsAt: true,
      application: { select: { profile: { select: { user: { select: { name: true } } } } } },
    },
  });
  const interviews = await db.interview.count({
    where: {
      organizationId: ctx.organizationId,
      status: "confirmed",
      startsAt: { gt: new Date() },
      OR: [{ organizerId: thread.other.id }, { participantIds: { has: thread.other.id } }],
    },
  });
  return {
    ...thread,
    interviews,
    next: next ? { at: next.startsAt!, name: next.application.profile.user.name } : null,
  };
}

export type ColleagueConversation = Awaited<ReturnType<typeof colleagueConversation>>;

/** The organization's message templates offered under the composer (never a decision). */
export async function composerTemplates(db: PrismaClient, ctx: HireContext) {
  return db.messageTemplate.findMany({
    where: {
      organizationId: ctx.organizationId,
      kind: { in: ["convocation", "document", "relance"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
    select: { id: true, title: true, body: true },
  });
}
