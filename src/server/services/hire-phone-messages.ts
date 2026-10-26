/**
 * Modèle B recruteur, lot M7 (mobile/captures section 07): the tab Messages of the recruiter's
 * phone. « Candidats » are the organization's conversations about an application, « Réseau » the
 * talents who accepted a proposal and the member's own relations, « Équipe » the conversations
 * between two members of the organization (`TeamThread`), which no talent and no other member can
 * read. Every query of the organization's data is filtered by `organizationId` (golden rule 6).
 */
import type { MembershipRole, PrismaClient } from "@/generated/prisma/client";
import { getConversation, markRead, MESSAGE_MAX } from "./connect";
import { HireError, hirePermissions, type HireContext } from "./hire";
import { notify } from "./notifications";
import { listRecruiterInbox } from "./recruiter-inbox";

export const RH_MESSAGE_TABS = ["candidats", "reseau", "equipe"] as const;
export type RhMessageTab = (typeof RH_MESSAGE_TABS)[number];

export type RhMessageRow = {
  id: string;
  href: string;
  tab: RhMessageTab;
  /** For the initials' tint: the person's id. */
  personId: string;
  name: string;
  /** The green line: the offer and its stage, the relation, or the colleague's role. */
  context: {
    kind: "application" | "proposal" | "relation" | "team";
    job?: string | null;
    stage?: string | null;
    headline?: string | null;
    role?: MembershipRole;
  };
  preview: string | null;
  /** The last message is the member's own (« Vous : »). */
  mine: boolean;
  /** The last message comes from the other side: an answer is awaited. */
  waiting: boolean;
  unread: number;
  /** Pinned for the whole team (« Épingler »): first in its list. */
  pinned?: boolean;
  at: Date;
};

const sorted = (a: string, b: string) => (a < b ? [a, b] : [b, a]) as [string, string];

/** The other active members of the organization, the newest first. */
export async function teamMembers(db: PrismaClient, ctx: HireContext) {
  const rows = await db.membership.findMany({
    where: { organizationId: ctx.organizationId, status: "active", userId: { not: ctx.userId } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      role: true,
      jobTitle: true,
      user: { select: { id: true, name: true, recruiterProfile: { select: { jobTitle: true } } } },
    },
  });
  return rows.map((row) => ({
    id: row.user.id,
    name: row.user.name,
    role: row.role,
    jobTitle: row.user.recruiterProfile?.jobTitle ?? row.jobTitle ?? null,
  }));
}

async function activeMember(db: PrismaClient, organizationId: string, userId: string) {
  return db.membership.findFirst({
    where: { organizationId, userId, status: "active" },
    select: { role: true, jobTitle: true, user: { select: { recruiterProfile: true } } },
  });
}

/** The three lists of the tab (planches 120 to 122). */
export async function rhMessages(db: PrismaClient, ctx: HireContext): Promise<RhMessageRow[]> {
  const [inbox, peers, threads, members] = await Promise.all([
    listRecruiterInbox(db, ctx),
    db.conversation.findMany({
      where: {
        kind: "peer",
        participants: { some: { userId: ctx.userId } },
        connection: { status: "accepted" },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true,
        lastMessageAt: true,
        participants: {
          where: { userId: ctx.userId },
          select: { lastReadAt: true, clearedAt: true },
        },
        connection: {
          select: {
            requester: {
              select: { id: true, name: true, talentProfile: { select: { headline: true } } },
            },
            addressee: {
              select: { id: true, name: true, talentProfile: { select: { headline: true } } },
            },
          },
        },
        messages: {
          where: { hiddenAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { senderId: true, body: true, createdAt: true },
        },
      },
    }),
    db.teamThread.findMany({
      where: {
        organizationId: ctx.organizationId,
        OR: [{ memberAId: ctx.userId }, { memberBId: ctx.userId }],
        messages: { some: {} },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true,
        memberAId: true,
        memberBId: true,
        aReadAt: true,
        bReadAt: true,
        lastMessageAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { authorId: true, body: true, createdAt: true },
        },
      },
    }),
    teamMembers(db, ctx),
  ]);
  const rows: RhMessageRow[] = inbox.rows.map((row) => ({
    id: row.id,
    href: `/app/messages/${row.id}`,
    tab: row.proposal ? "reseau" : "candidats",
    personId: row.talentUserId,
    name: row.name,
    context: row.proposal
      ? { kind: "proposal", job: row.job }
      : { kind: "application", job: row.job, stage: row.stage },
    preview: row.last?.body ?? null,
    mine: row.lastMine,
    waiting: row.waiting,
    unread: row.unread,
    pinned: row.pinned,
    at: row.at,
  }));
  for (const peer of peers) {
    const { requester, addressee } = peer.connection!;
    const other = requester.id === ctx.userId ? addressee : requester;
    const readAt = peer.participants[0]?.lastReadAt ?? null;
    const clearedAt = peer.participants[0]?.clearedAt ?? null;
    const shown = peer.messages.filter((m) => !clearedAt || m.createdAt > clearedAt);
    const last = shown[0] ?? null;
    rows.push({
      id: peer.id,
      href: `/app/messages/${peer.id}`,
      tab: "reseau",
      personId: other.id,
      name: other.name,
      context: { kind: "relation", headline: other.talentProfile?.headline ?? null },
      preview: last?.body ?? null,
      mine: last?.senderId === ctx.userId,
      waiting: last !== null && last.senderId === other.id,
      unread: shown.filter(
        (m) =>
          m.senderId !== ctx.userId && m.senderId !== null && (!readAt || m.createdAt > readAt),
      ).length,
      at: last?.createdAt ?? peer.lastMessageAt,
    });
  }
  const byId = new Map(members.map((member) => [member.id, member]));
  for (const thread of threads) {
    const otherId = thread.memberAId === ctx.userId ? thread.memberBId : thread.memberAId;
    const other = byId.get(otherId);
    // A colleague who left the organization: the conversation stays out of the list.
    if (!other) continue;
    const readAt = thread.memberAId === ctx.userId ? thread.aReadAt : thread.bReadAt;
    const last = thread.messages[0] ?? null;
    rows.push({
      id: thread.id,
      href: `/app/messages/equipe/${thread.id}`,
      tab: "equipe",
      personId: other.id,
      name: other.name,
      context: { kind: "team", headline: other.jobTitle, role: other.role },
      preview: last?.body ?? null,
      mine: last?.authorId === ctx.userId,
      waiting: last !== null && last.authorId === otherId,
      unread: thread.messages.filter(
        (m) => m.authorId === otherId && (!readAt || m.createdAt > readAt),
      ).length,
      at: last?.createdAt ?? thread.lastMessageAt,
    });
  }
  return rows.sort(
    (a, b) =>
      Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.at.getTime() - a.at.getTime(),
  );
}

/**
 * « Nouveau message » (planche 124): a candidate already in conversation, or a colleague. A talent
 * is reached through « Proposer une offre », never by a message out of the blue.
 */
export async function newMessageChoices(db: PrismaClient, ctx: HireContext) {
  const [inbox, members] = await Promise.all([listRecruiterInbox(db, ctx), teamMembers(db, ctx)]);
  return {
    candidates: inbox.rows
      .filter((row) => !row.proposal)
      .slice(0, 20)
      .map((row) => ({ id: row.id, personId: row.talentUserId, name: row.name, job: row.job })),
    members,
  };
}

/** Opens (or creates) the conversation with a colleague of the same organization. */
export async function openTeamThread(db: PrismaClient, ctx: HireContext, otherId: string) {
  if (otherId === ctx.userId) throw new HireError("notFound");
  if (!(await activeMember(db, ctx.organizationId, otherId))) throw new HireError("notFound");
  const [memberAId, memberBId] = sorted(ctx.userId, otherId);
  const thread = await db.teamThread.upsert({
    where: {
      organizationId_memberAId_memberBId: {
        organizationId: ctx.organizationId,
        memberAId,
        memberBId,
      },
    },
    update: {},
    create: { organizationId: ctx.organizationId, memberAId, memberBId },
    select: { id: true },
  });
  return thread.id;
}

async function ownThread(db: PrismaClient, ctx: HireContext, threadId: string) {
  const thread = await db.teamThread.findFirst({
    where: {
      id: threadId,
      organizationId: ctx.organizationId,
      OR: [{ memberAId: ctx.userId }, { memberBId: ctx.userId }],
    },
  });
  if (!thread) throw new HireError("notFound");
  const otherId = thread.memberAId === ctx.userId ? thread.memberBId : thread.memberAId;
  return { thread, otherId, side: thread.memberAId === ctx.userId ? "a" : "b" } as const;
}

/** A conversation with a colleague (planches 132, 133), marked read for the member. */
export async function teamThread(
  db: PrismaClient,
  ctx: HireContext,
  threadId: string,
  now = new Date(),
) {
  const { thread, otherId, side } = await ownThread(db, ctx, threadId);
  const [other, membership, messages] = await Promise.all([
    db.user.findUnique({ where: { id: otherId }, select: { id: true, name: true } }),
    activeMember(db, ctx.organizationId, otherId),
    db.teamMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      take: 300,
      select: { id: true, authorId: true, body: true, createdAt: true },
    }),
  ]);
  await db.teamThread.update({
    where: { id: thread.id },
    data: side === "a" ? { aReadAt: now } : { bReadAt: now },
  });
  return {
    id: thread.id,
    other: {
      id: otherId,
      name: other?.name ?? "",
      role: membership?.role ?? null,
      jobTitle: membership?.user.recruiterProfile?.jobTitle ?? membership?.jobTitle ?? null,
      /** Left the organization: the conversation can be read, no longer answered. */
      left: membership === null,
    },
    messages: messages.map((message) => ({
      id: message.id,
      mine: message.authorId === ctx.userId,
      body: message.body,
      at: message.createdAt,
    })),
  };
}

/** Writes to a colleague; the colleague is told (`teamMessage`). */
export async function sendTeamMessage(
  db: PrismaClient,
  ctx: HireContext,
  threadId: string,
  text: string,
  senderName: string,
  now = new Date(),
) {
  const { thread, otherId, side } = await ownThread(db, ctx, threadId);
  if (!(await activeMember(db, ctx.organizationId, otherId))) throw new HireError("notFound");
  const body = text.trim().slice(0, MESSAGE_MAX);
  if (!body) throw new HireError("invalid");
  await db.teamMessage.create({
    data: { threadId: thread.id, authorId: ctx.userId, body, createdAt: now },
  });
  await db.teamThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: now, ...(side === "a" ? { aReadAt: now } : { bReadAt: now }) },
  });
  await notify(db, {
    userIds: [otherId],
    type: "teamMessage",
    payload: { name: senderName },
    href: `/app/messages/equipe/${thread.id}`,
  });
}

/**
 * A relation of the member (planches 130, 131): the conversation between two people, read as the
 * person and not as the organization.
 */
export async function relationThread(db: PrismaClient, userId: string, conversationId: string) {
  const conversation = await getConversation(db, { userId }, conversationId);
  if (conversation.kind !== "peer") throw new HireError("notFound");
  await markRead(db, { userId }, conversation.id);
  return conversation;
}

/** May the member write in the organization's conversations? */
export const canWrite = (ctx: HireContext) => hirePermissions(ctx.role).manage;
