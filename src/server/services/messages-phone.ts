/**
 * Messages on the phone (Modèle B, lot B8, planches Messages): the conversations of a talent in
 * three rubrics, a conversation with its people and its cards, what was shared in it, and the
 * search of the tab. Rules kept from Connect (`connect.ts`):
 * - a talent writes only to their connections, and answers the organizations that wrote to them;
 * - « Effacer la discussion » hides the messages for this person only, nothing is deleted;
 * - « Messages éphémères » (between two talents) hides new messages for both after the delay;
 * - a message hidden by moderation is never shown.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { ConnectError } from "./connect";

export const inboxTabs = ["connexions", "recruteurs", "entreprises"] as const;
export type InboxTab = (typeof inboxTabs)[number];

/** « 24 heures », « 7 jours », « 90 jours » (planche Messages-ephem). */
export const ephemeralChoices = [86_400, 7 * 86_400, 90 * 86_400] as const;

export const searchTypes = ["photos", "docs", "liens", "contacts", "vocaux", "rdv"] as const;
export type SearchType = (typeof searchTypes)[number];

const kindsOfType: Record<SearchType, Prisma.MessageWhereInput> = {
  photos: { kind: "image" },
  docs: { kind: "file" },
  liens: { payload: { path: ["link"], string_starts_with: "http" } },
  contacts: { kind: "contact" },
  vocaux: { kind: "voice" },
  rdv: { kind: { in: ["slot", "invitation"] } },
};

const personSelect = {
  id: true,
  name: true,
  firstName: true,
  image: true,
  emailVerified: true,
  lastSeenAt: true,
  showPresence: true,
  readReceipts: true,
  talentProfile: {
    select: {
      headline: true,
      desiredJobTitles: true,
      desiredLocations: true,
      experiences: {
        where: { endDate: null },
        orderBy: { startDate: "desc" },
        take: 1,
        select: { title: true, company: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type InboxPerson = Prisma.UserGetPayload<{ select: typeof personSelect }>;

const orgSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  verifiedAt: true,
  sector: true,
  city: true,
} satisfies Prisma.OrganizationSelect;

export type InboxOrganization = Prisma.OrganizationGetPayload<{ select: typeof orgSelect }>;

/** The conversations a talent sees from the personal space (Connect's access rule). */
function talentWhere(userId: string): Prisma.ConversationWhereInput {
  return {
    OR: [
      { talentUserId: userId, kind: { not: "peer" } },
      { kind: "peer", participants: { some: { userId } } },
    ],
  };
}

/** The messages this person still sees: not hidden, not expired, not cleared by them. */
export function visibleWhere(now: Date, clearedAt: Date | null): Prisma.MessageWhereInput {
  return {
    hiddenAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
  };
}

const conversationInclude = () =>
  ({
    organization: { select: orgSelect },
    application: { select: { id: true, job: { select: { title: true, slug: true } } } },
    connection: {
      select: {
        id: true,
        status: true,
        blockedById: true,
        requester: { select: personSelect },
        addressee: { select: personSelect },
      },
    },
    participants: {
      select: {
        userId: true,
        lastReadAt: true,
        mutedAt: true,
        clearedAt: true,
        user: { select: { readReceipts: true } },
      },
    },
  }) satisfies Prisma.ConversationInclude;

type ConversationRow = Prisma.ConversationGetPayload<{
  include: ReturnType<typeof conversationInclude>;
}>;

export type LastMessage = {
  id: string;
  senderId: string | null;
  body: string;
  kind: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
};

const lastSelect = {
  id: true,
  senderId: true,
  body: true,
  kind: true,
  payload: true,
  createdAt: true,
} satisfies Prisma.MessageSelect;

/** Who the talent talks with: the other talent, the recruiter who wrote, or the organization. */
export type Counterpart =
  | { kind: "person"; person: InboxPerson; organization: InboxOrganization | null }
  | { kind: "organization"; organization: InboxOrganization };

export type InboxItem = {
  id: string;
  tab: InboxTab;
  counterpart: Counterpart;
  last: LastMessage | null;
  unread: number;
  muted: boolean;
  jobTitle: string | null;
};

async function lastOrgSender(db: PrismaClient, conversationId: string, userId: string) {
  const row = await db.message.findFirst({
    where: {
      conversationId,
      senderId: { not: userId },
      kind: { not: "system" },
      NOT: { senderId: null },
    },
    orderBy: { createdAt: "desc" },
    select: { senderId: true },
  });
  if (!row?.senderId) return null;
  return db.user.findUnique({ where: { id: row.senderId }, select: personSelect });
}

async function itemOf(
  db: PrismaClient,
  row: ConversationRow,
  userId: string,
  now: Date,
): Promise<InboxItem | null> {
  const me = row.participants.find((participant) => participant.userId === userId) ?? null;
  const visible = visibleWhere(now, me?.clearedAt ?? null);
  const [last, unread, sender] = await Promise.all([
    db.message.findFirst({
      where: { conversationId: row.id, ...visible },
      orderBy: { createdAt: "desc" },
      select: lastSelect,
    }),
    db.message.count({
      where: {
        conversationId: row.id,
        ...visible,
        NOT: { senderId: userId },
        ...(me?.lastReadAt ? { AND: [{ createdAt: { gt: me.lastReadAt } }] } : {}),
      },
    }),
    row.kind === "peer" ? Promise.resolve(null) : lastOrgSender(db, row.id, userId),
  ]);
  let counterpart: Counterpart;
  let tab: InboxTab;
  if (row.kind === "peer") {
    const connection = row.connection;
    if (!connection) return null;
    const other = connection.requester.id === userId ? connection.addressee : connection.requester;
    counterpart = { kind: "person", person: other, organization: null };
    tab = "connexions";
  } else {
    if (!row.organization) return null;
    if (sender) {
      counterpart = { kind: "person", person: sender, organization: row.organization };
      tab = "recruteurs";
    } else {
      counterpart = { kind: "organization", organization: row.organization };
      tab = "entreprises";
    }
  }
  return {
    id: row.id,
    tab,
    counterpart,
    last,
    unread,
    muted: Boolean(me?.mutedAt),
    jobTitle: row.application?.job.title ?? null,
  };
}

/** The three rubrics of the tab, the newest conversation first. */
export async function phoneInbox(db: PrismaClient, userId: string, now = new Date()) {
  const rows = await db.conversation.findMany({
    where: talentWhere(userId),
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: conversationInclude(),
  });
  const items = (await Promise.all(rows.map((row) => itemOf(db, row, userId, now)))).filter(
    (item): item is InboxItem => item !== null,
  );
  // A conversation without any visible message stays in the list only between connections.
  return items.filter((item) => item.last !== null || item.tab === "connexions");
}

/** Connection requests received, with their word, and organizations asking to talk. */
export async function phoneRequests(db: PrismaClient, userId: string, now = new Date()) {
  const [connections, contacts] = await Promise.all([
    db.connection.findMany({
      where: { status: "pending", addresseeId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, note: true, createdAt: true, requester: { select: personSelect } },
    }),
    db.contactRequest.findMany({
      where: { profile: { userId }, status: "pending", expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        message: true,
        organization: { select: orgSelect },
        job: { select: { title: true } },
      },
    }),
  ]);
  return { connections, contacts };
}

/** Accepted connections, for « Nouveau message », « Partager un contact » and the search. */
export async function phoneConnections(db: PrismaClient, userId: string) {
  const rows = await db.connection.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    orderBy: { respondedAt: "desc" },
    take: 200,
    select: {
      id: true,
      requester: { select: personSelect },
      addressee: { select: personSelect },
      conversation: { select: { id: true } },
    },
  });
  return rows.map((row) => ({
    connectionId: row.id,
    conversationId: row.conversation?.id ?? null,
    person: row.requester.id === userId ? row.addressee : row.requester,
  }));
}

/** The conversation of an accepted connection, created when it does not exist yet. */
export async function ensurePeerConversation(
  db: PrismaClient,
  userId: string,
  connectionId: string,
  now = new Date(),
) {
  const connection = await db.connection.findFirst({
    where: {
      id: connectionId,
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { id: true, requesterId: true, addresseeId: true, conversation: true },
  });
  if (!connection) throw new ConnectError("notFound");
  if (connection.conversation) return connection.conversation.id;
  try {
    const created = await db.conversation.create({
      data: {
        kind: "peer",
        connectionId: connection.id,
        talentUserId: connection.requesterId,
        lastMessageAt: now,
        participants: {
          create: [{ userId: connection.requesterId }, { userId: connection.addresseeId }],
        },
      },
    });
    return created.id;
  } catch {
    const existing = await db.conversation.findUniqueOrThrow({
      where: { connectionId: connection.id },
    });
    return existing.id;
  }
}

/** Organizations the talent can share: those they follow, then those they applied to. */
export async function shareableOrganizations(db: PrismaClient, userId: string) {
  const [follows, applied] = await Promise.all([
    db.feedFollow.findMany({
      where: { followerId: userId, organizationId: { not: null } },
      take: 30,
      select: { organization: { select: orgSelect } },
    }),
    db.organization.findMany({
      where: { jobs: { some: { applications: { some: { profile: { userId } } } } } },
      take: 30,
      select: orgSelect,
    }),
  ]);
  const seen = new Map<string, InboxOrganization>();
  for (const org of [...follows.map((row) => row.organization), ...applied])
    if (org && !seen.has(org.id)) seen.set(org.id, org);
  return [...seen.values()];
}

export type ThreadMessage = {
  id: string;
  senderId: string | null;
  body: string;
  kind: string;
  payload: Prisma.JsonValue;
  expiresAt: Date | null;
  hiddenAt: Date | null;
  createdAt: Date;
};

/** One conversation as its talent sees it on the phone. */
export async function phoneConversation(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  now = new Date(),
) {
  const row = await db.conversation.findFirst({
    where: { id: conversationId, ...talentWhere(userId) },
    include: conversationInclude(),
  });
  if (!row) throw new ConnectError("notFound");
  const item = await itemOf(db, row, userId, now);
  if (!item) throw new ConnectError("notFound");
  const me = row.participants.find((participant) => participant.userId === userId) ?? null;
  // A message withdrawn by the company or hidden after a report keeps its place, as a line.
  const messages: ThreadMessage[] = await db.message.findMany({
    where: { conversationId, ...visibleWhere(now, me?.clearedAt ?? null), hiddenAt: undefined },
    orderBy: { createdAt: "asc" },
    take: 300,
    select: {
      id: true,
      senderId: true,
      body: true,
      kind: true,
      payload: true,
      expiresAt: true,
      hiddenAt: true,
      createdAt: true,
    },
  });
  // « Lu » under my messages: the latest reading of the other side, when both keep receipts on.
  const others = row.participants.filter((participant) => participant.userId !== userId);
  const myself = await db.user.findUnique({
    where: { id: userId },
    select: { readReceipts: true, showPresence: true, name: true, firstName: true },
  });
  const readBy = myself?.readReceipts
    ? others
        .filter((participant) => participant.user.readReceipts && participant.lastReadAt)
        .reduce<Date | null>(
          (latest, participant) =>
            !latest || participant.lastReadAt! > latest ? participant.lastReadAt : latest,
          null,
        )
    : null;
  const connection = row.connection;
  const blocked = row.kind === "peer" ? connection?.status === "blocked" : row.blockedAt !== null;
  const blockedByMe =
    row.kind === "peer"
      ? connection?.status === "blocked" && connection.blockedById === userId
      : row.blockedAt !== null;
  // Between talents, only an accepted connection writes; an organization's conversation always
  // accepts the talent's answer unless the talent blocked it.
  const canWrite = row.kind === "peer" ? connection?.status === "accepted" : !row.blockedAt;
  return {
    item,
    kind: row.kind,
    connectionId: connection?.id ?? null,
    jobTitle: row.application?.job.title ?? null,
    jobSlug: row.application?.job.slug ?? null,
    ephemeralSeconds: row.kind === "peer" ? row.ephemeralSeconds : null,
    muted: Boolean(me?.mutedAt),
    blocked,
    blockedByMe,
    canWrite,
    readBy,
    viewer: {
      showPresence: myself?.showPresence ?? true,
      name: myself?.name ?? "",
      firstName: myself?.firstName ?? null,
    },
    messages,
  };
}

export type PhoneConversation = Awaited<ReturnType<typeof phoneConversation>>;

/** « Mode silencieux »: the messages arrive, the person is not told. */
export async function setMuted(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  muted: boolean,
  now = new Date(),
) {
  await phoneConversationAccess(db, userId, conversationId);
  await db.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    update: { mutedAt: muted ? now : null },
    create: { conversationId, userId, mutedAt: muted ? now : null },
  });
}

/** « Effacer la discussion »: hidden for this person from now on; the other side keeps it. */
export async function clearConversation(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  now = new Date(),
) {
  await phoneConversationAccess(db, userId, conversationId);
  await db.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    update: { clearedAt: now, lastReadAt: now },
    create: { conversationId, userId, clearedAt: now, lastReadAt: now },
  });
}

/**
 * « Messages éphémères » between two talents: the new messages are hidden for both after the
 * delay (they stay in the database). A line in the conversation tells both sides.
 */
export async function setEphemeral(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  seconds: number | null,
  line: string,
  now = new Date(),
) {
  const conversation = await phoneConversationAccess(db, userId, conversationId);
  if (conversation.kind !== "peer") throw new ConnectError("invalid");
  if (seconds !== null && !(ephemeralChoices as readonly number[]).includes(seconds))
    throw new ConnectError("invalid");
  if ((conversation.ephemeralSeconds ?? null) === seconds) return;
  await db.$transaction([
    db.conversation.update({
      where: { id: conversationId },
      data: { ephemeralSeconds: seconds, lastMessageAt: now },
    }),
    db.message.create({
      data: {
        conversationId,
        senderId: null,
        kind: "system",
        body: line,
        // Worded for each side on the phone: « Vous avez activé… » or « Patrick a activé… ».
        payload: { ephemeral: { by: userId, seconds } },
        createdAt: now,
      },
    }),
  ]);
}

async function phoneConversationAccess(db: PrismaClient, userId: string, conversationId: string) {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, ...talentWhere(userId) },
    select: { id: true, kind: true, ephemeralSeconds: true },
  });
  if (!conversation) throw new ConnectError("notFound");
  return conversation;
}

/** A message of one of the talent's conversations that they still see (media, forward). */
export async function visibleMessage(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  messageId: string,
  now = new Date(),
) {
  await phoneConversationAccess(db, userId, conversationId);
  const me = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { clearedAt: true },
  });
  const message = await db.message.findFirst({
    where: { id: messageId, conversationId, ...visibleWhere(now, me?.clearedAt ?? null) },
  });
  if (!message) throw new ConnectError("notFound");
  return message;
}

/** The messages of all the talent's conversations matching a word or a kind (the search). */
export async function searchMessages(
  db: PrismaClient,
  userId: string,
  input: { query: string; type: SearchType | null },
  now = new Date(),
) {
  const conversations = await db.conversation.findMany({
    where: talentWhere(userId),
    select: { id: true, participants: { where: { userId }, select: { clearedAt: true } } },
    take: 100,
  });
  const text = input.query.trim().slice(0, 80);
  const filters: Prisma.MessageWhereInput[] = conversations.map((conversation) => ({
    conversationId: conversation.id,
    ...visibleWhere(now, conversation.participants[0]?.clearedAt ?? null),
  }));
  if (filters.length === 0) return [];
  const type: Prisma.MessageWhereInput = input.type
    ? kindsOfType[input.type]
    : { kind: { not: "system" } };
  return db.message.findMany({
    where: {
      AND: [{ OR: filters }, type, text ? { body: { contains: text, mode: "insensitive" } } : {}],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { ...lastSelect, conversationId: true },
  });
}
