/**
 * Connect (partie 07 § 3 et § 4, partie 06 § 6.3): one conversation per application, between the
 * talent and the recruiting team of the organization. Access rules:
 * - the talent of the conversation, from the personal space;
 * - an active member of the organization (not a viewer), from that organization's space.
 * - for a « peer » conversation (lot 6, Connexions), the two talents of an accepted connection.
 * Anyone else gets "not found". A conversation blocked by the talent accepts no more messages
 * from the organization; a peer conversation accepts messages only while the connection holds.
 */
import type { MessageKind, Prisma, PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, type HireContext } from "./hire";
import { hiringTeam, markConversationNotificationsRead } from "./notifications";

export type Viewer = { userId: string; hire?: HireContext | null };

export class ConnectError extends Error {
  constructor(readonly code: "notFound" | "blocked" | "invalid") {
    super(code);
    this.name = "ConnectError";
  }
}

export const MESSAGE_MAX = 4000;

/** The conversation of an application, created on first use. */
export async function ensureApplicationConversation(db: PrismaClient, applicationId: string) {
  const existing = await db.conversation.findUnique({ where: { applicationId } });
  if (existing) return existing;
  const application = await db.application.findUniqueOrThrow({
    where: { id: applicationId },
    select: { job: { select: { organizationId: true } }, profile: { select: { userId: true } } },
  });
  try {
    return await db.conversation.create({
      data: {
        kind: "application",
        applicationId,
        organizationId: application.job.organizationId,
        talentUserId: application.profile.userId,
      },
    });
  } catch {
    // Created at the same time by the other side.
    return db.conversation.findUniqueOrThrow({ where: { applicationId } });
  }
}

function accessWhere(viewer: Viewer): Prisma.ConversationWhereInput {
  if (viewer.hire) {
    if (!hirePermissions(viewer.hire.role).readApplications) return { id: "__none__" };
    return { organizationId: viewer.hire.organizationId };
  }
  return {
    OR: [
      { talentUserId: viewer.userId, kind: { not: "peer" } },
      { kind: "peer", participants: { some: { userId: viewer.userId } } },
    ],
  };
}

const peerSide = { select: { id: true, name: true, image: true } } as const;

/** Built at each call: « now » decides which ephemeral messages are still shown. */
const listInclude = () =>
  ({
    organization: { select: { name: true, verifiedAt: true, logo: true } },
    application: {
      select: {
        id: true,
        job: { select: { title: true, slug: true } },
        stage: { select: { name: true } },
        profile: { select: { user: { select: { name: true } } } },
      },
    },
    contactRequest: {
      select: {
        job: { select: { title: true } },
        profile: { select: { id: true, user: { select: { name: true } } } },
      },
    },
    connection: {
      select: {
        id: true,
        status: true,
        blockedById: true,
        requester: peerSide,
        addressee: peerSide,
      },
    },
    messages: {
      where: { hiddenAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  }) satisfies Prisma.ConversationInclude;

export async function listConversations(db: PrismaClient, viewer: Viewer) {
  const conversations = await db.conversation.findMany({
    where: accessWhere(viewer),
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { ...listInclude(), participants: { where: { userId: viewer.userId } } },
  });
  return conversations.map((conversation) => {
    const last = conversation.messages[0] ?? null;
    const readAt = conversation.participants[0]?.lastReadAt ?? null;
    return {
      ...conversation,
      last,
      unread:
        last !== null && last.senderId !== viewer.userId && (!readAt || last.createdAt > readAt),
    };
  });
}

export async function unreadCount(db: PrismaClient, viewer: Viewer) {
  return (await listConversations(db, viewer)).filter((item) => item.unread).length;
}

export async function getConversation(db: PrismaClient, viewer: Viewer, id: string) {
  const conversation = await db.conversation.findFirst({
    where: { id, ...accessWhere(viewer) },
    include: {
      ...listInclude(),
      // « Messages éphémères » (Modèle B lot B8): an expired message is no longer shown.
      messages: {
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        orderBy: { createdAt: "asc" },
        take: 300,
      },
    },
  });
  if (!conversation) throw new ConnectError("notFound");
  return conversation;
}

export async function markRead(
  db: PrismaClient,
  viewer: Viewer,
  conversationId: string,
  now = new Date(),
) {
  await db.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId: viewer.userId } },
    update: { lastReadAt: now },
    create: { conversationId, userId: viewer.userId, lastReadAt: now },
  });
  // What was read here leaves the notifications too.
  await markConversationNotificationsRead(db, viewer.userId, conversationId);
}

export type SentMessage = {
  conversationId: string;
  messageId: string;
  /** Who should be told: the talent, or the members of the organization who took part. */
  recipients: string[];
  fromOrganization: boolean;
};

export async function sendMessage(
  db: PrismaClient,
  viewer: Viewer,
  conversationId: string,
  input: { body: string; kind?: MessageKind; payload?: Prisma.InputJsonObject },
  now = new Date(),
): Promise<SentMessage> {
  const conversation = await getConversation(db, viewer, conversationId);
  const fromOrganization = Boolean(viewer.hire);
  if (fromOrganization && !hirePermissions(viewer.hire!.role).manage)
    throw new ConnectError("notFound");
  if (fromOrganization && conversation.blockedAt) throw new ConnectError("blocked");
  if (conversation.kind === "peer" && conversation.connection?.status !== "accepted")
    throw new ConnectError("blocked");
  const body = input.body.trim().slice(0, MESSAGE_MAX);
  if (!body) throw new ConnectError("invalid");
  const message = await db.message.create({
    data: {
      conversationId,
      senderId: viewer.userId,
      body,
      kind: input.kind ?? "text",
      payload: input.payload ?? {},
      createdAt: now,
      expiresAt: conversation.ephemeralSeconds
        ? new Date(now.getTime() + conversation.ephemeralSeconds * 1000)
        : null,
    },
  });
  await db.conversation.update({
    where: { id: conversationId },
    // A conversation the organization removed from its list comes back with a new message.
    data: { lastMessageAt: now, orgHiddenAt: null },
  });
  await markRead(db, viewer, conversationId, now);
  let recipients: string[];
  if (conversation.kind === "peer") {
    const { requester, addressee } = conversation.connection!;
    recipients = [requester.id === viewer.userId ? addressee.id : requester.id];
  } else if (fromOrganization) {
    recipients = [conversation.talentUserId];
  } else {
    const senders = await db.message.findMany({
      where: { conversationId, senderId: { not: viewer.userId } },
      distinct: ["senderId"],
      select: { senderId: true },
    });
    recipients = senders.map((row) => row.senderId).filter((id): id is string => Boolean(id));
    // Nobody from the organization has written yet: the hiring team is told.
    if (recipients.length === 0 && conversation.organizationId) {
      recipients = (await hiringTeam(db, conversation.organizationId)).map((member) => member.id);
    }
  }
  // « Couper les notifications » (recruteur lot 6): the message arrives, the person is not told.
  if (recipients.length > 0) {
    const muted = await db.conversationParticipant.findMany({
      where: { conversationId, userId: { in: recipients }, mutedAt: { not: null } },
      select: { userId: true },
    });
    if (muted.length > 0) {
      const off = new Set(muted.map((row) => row.userId));
      recipients = recipients.filter((id) => !off.has(id));
    }
  }
  if (conversation.application && message.kind !== "system") {
    await db.applicationEvent.create({
      data: {
        applicationId: conversation.application.id,
        actorId: viewer.userId,
        type: input.kind === "document_request" ? "document_requested" : "message",
        payload:
          input.kind === "document_request" ? { name: String(input.payload?.name ?? "") } : {},
      },
    });
  }
  return { conversationId, messageId: message.id, recipients, fromOrganization };
}

/**
 * The talent stops all messages from the organization; applications are not withdrawn. In a peer
 * conversation, the connection with the other talent is blocked instead.
 */
export async function blockConversation(
  db: PrismaClient,
  viewer: Viewer,
  conversationId: string,
  blocked: boolean,
) {
  if (viewer.hire) throw new ConnectError("notFound");
  const conversation = await getConversation(db, viewer, conversationId);
  if (conversation.kind === "peer") {
    // Between two talents the connection is blocked, both ways; unblocking does not reconnect.
    const connection = conversation.connection!;
    if (blocked) {
      if (connection.status === "blocked") return;
      await db.connection.update({
        where: { id: connection.id },
        data: { status: "blocked", blockedById: viewer.userId, respondedAt: new Date() },
      });
    } else if (connection.status === "blocked" && connection.blockedById === viewer.userId) {
      await db.connection.update({
        where: { id: connection.id },
        data: { status: "declined", blockedById: null },
      });
    }
    return;
  }
  await db.conversation.update({
    where: { id: conversation.id },
    data: { blockedAt: blocked ? new Date() : null },
  });
}

/**
 * The talent answers a document request with one of their CVs: a copy is attached, like for an
 * application, so later edits do not change what the recruiter received.
 */
export async function answerDocumentRequest(
  db: PrismaClient,
  viewer: Viewer,
  conversationId: string,
  requestId: string,
  documentId: string,
  now = new Date(),
) {
  if (viewer.hire) throw new ConnectError("notFound");
  const conversation = await getConversation(db, viewer, conversationId);
  const request = conversation.messages.find(
    (message) => message.id === requestId && message.kind === "document_request",
  );
  if (!request) throw new ConnectError("notFound");
  const document = await db.document.findFirst({
    where: { id: documentId, profile: { userId: viewer.userId } },
  });
  if (!document) throw new ConnectError("notFound");
  const payload = (request.payload ?? {}) as Prisma.JsonObject;
  await db.message.update({
    where: { id: request.id },
    data: { payload: { ...payload, submittedAt: now.toISOString() } },
  });
  return sendMessage(
    db,
    viewer,
    conversationId,
    {
      body: document.title,
      payload: {
        requestId,
        document: {
          title: document.title,
          templateId: document.templateId,
          content: document.content as Prisma.InputJsonValue,
          ...(document.style ? { style: document.style as Prisma.InputJsonValue } : {}),
        },
      },
    },
    now,
  );
}

/** The other talent of a peer conversation, seen by `viewerId`. */
export function peerOf(
  conversation: {
    connection: { requester: PeerSide; addressee: PeerSide } | null;
  },
  viewerId: string,
) {
  const connection = conversation.connection;
  if (!connection) return null;
  return connection.requester.id === viewerId ? connection.addressee : connection.requester;
}

type PeerSide = { id: string; name: string; image: string | null };
