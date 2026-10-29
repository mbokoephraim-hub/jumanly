/**
 * Connexions (refonte mobile, lot 6, planche talent-4 « Connexions »): two talents connect when
 * one asks and the other accepts. Only then can they write to each other, in one « peer »
 * conversation. Rules:
 * - a request goes to any member Explorer can show (Ephraïm 27/10/2026), never to an anonymous
 *   profile, and the other person decides;
 * - the person who receives a request accepts or ignores it, and the requester is not told;
 * - either side can remove a connection: the conversation stays readable but accepts no message;
 * - blocking stops any new request in both directions; a report reaches the moderation queue;
 * - a new request reaches the other person's bell, and an accepted one the requester's (Ephraïm
 *   29/10/2026, « Connexions » of the Chat).
 * No connection data is used for matching.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { findablePeopleWhere } from "./explore";
import { notify } from "./notifications";

export class ConnectionError extends Error {
  constructor(readonly code: "notFound" | "self" | "blocked") {
    super(code);
    this.name = "ConnectionError";
  }
}

const personSelect = {
  id: true,
  name: true,
  image: true,
  talentProfile: {
    select: {
      id: true,
      headline: true,
      desiredJobTitles: true,
      experiences: {
        where: { endDate: null },
        orderBy: { startDate: "desc" },
        take: 1,
        select: { company: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

type PersonRow = Prisma.UserGetPayload<{ select: typeof personSelect }>;

export type Person = {
  userId: string;
  name: string;
  image: string | null;
  /** The title of the person, then their current organization when they have one. */
  title: string | null;
  company: string | null;
  /** Accepted connections the viewer and this person have in common. */
  mutual: number;
};

function person(row: PersonRow, mutual: number): Person {
  const profile = row.talentProfile;
  return {
    userId: row.id,
    name: row.name,
    image: row.image,
    title: profile?.headline || profile?.desiredJobTitles[0] || null,
    company: profile?.experiences[0]?.company ?? null,
    mutual,
  };
}

const pair = (a: string, b: string): Prisma.ConnectionWhereInput => ({
  OR: [
    { requesterId: a, addresseeId: b },
    { requesterId: b, addresseeId: a },
  ],
});

/** The people each of `userIds` is connected to (accepted), by user. */
async function circles(db: PrismaClient, userIds: string[]) {
  const rows = await db.connection.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: { in: userIds } }, { addresseeId: { in: userIds } }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const map = new Map<string, Set<string>>(userIds.map((id) => [id, new Set()]));
  for (const row of rows) {
    map.get(row.requesterId)?.add(row.addresseeId);
    map.get(row.addresseeId)?.add(row.requesterId);
  }
  return map;
}

async function withMutual(db: PrismaClient, viewerId: string, rows: PersonRow[]) {
  const map = await circles(db, [viewerId, ...rows.map((row) => row.id)]);
  const mine = map.get(viewerId) ?? new Set<string>();
  return rows.map((row) => {
    const theirs = map.get(row.id) ?? new Set<string>();
    let mutual = 0;
    for (const id of theirs) if (id !== viewerId && mine.has(id)) mutual += 1;
    return person(row, mutual);
  });
}

/** Counts for the « Compte » page and the tabs: accepted connections, requests received. */
export async function connectionCounts(db: PrismaClient, userId: string) {
  const [accepted, received] = await Promise.all([
    db.connection.count({
      where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    }),
    db.connection.count({ where: { status: "pending", addresseeId: userId } }),
  ]);
  return { accepted, received };
}

/** My connections (with the conversation to open) and the requests I received. */
export async function listConnections(db: PrismaClient, userId: string) {
  const [accepted, received, sent] = await Promise.all([
    db.connection.findMany({
      where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
      orderBy: { respondedAt: "desc" },
      take: 200,
      include: {
        requester: { select: personSelect },
        addressee: { select: personSelect },
        conversation: { select: { id: true } },
      },
    }),
    db.connection.findMany({
      where: { status: "pending", addresseeId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { requester: { select: personSelect } },
    }),
    db.connection.findMany({
      where: { status: "pending", requesterId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { addressee: { select: personSelect } },
    }),
  ]);
  const others = accepted.map((row) =>
    row.requesterId === userId ? row.addressee : row.requester,
  );
  const [people, requesters, addressees] = await Promise.all([
    withMutual(db, userId, others),
    withMutual(
      db,
      userId,
      received.map((row) => row.requester),
    ),
    withMutual(
      db,
      userId,
      sent.map((row) => row.addressee),
    ),
  ]);
  return {
    connections: accepted.map((row, index) => ({
      id: row.id,
      conversationId: row.conversation?.id ?? null,
      person: people[index],
    })),
    received: received.map((row, index) => ({ id: row.id, person: requesters[index] })),
    sent: sent.map((row, index) => ({ id: row.id, person: addressees[index] })),
  };
}

/**
 * People the viewer can ask to connect with: every member Explorer can show (not « Anonyme »),
 * found by name or title. Already connected, asked, or blocked people are left out.
 */
export async function searchPeople(db: PrismaClient, userId: string, query: string) {
  const text = query.trim().slice(0, 80);
  if (text.length < 2) return [];
  const links = await db.connection.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }], status: { not: "declined" } },
    select: { requesterId: true, addresseeId: true },
  });
  const excluded = new Set([userId]);
  for (const link of links) {
    excluded.add(link.requesterId);
    excluded.add(link.addresseeId);
  }
  const rows = await db.user.findMany({
    where: {
      id: { notIn: [...excluded] },
      ...findablePeopleWhere,
      OR: [
        { name: { contains: text, mode: "insensitive" } },
        { talentProfile: { is: { headline: { contains: text, mode: "insensitive" } } } },
      ],
    },
    orderBy: { name: "asc" },
    take: 20,
    select: personSelect,
  });
  return withMutual(db, userId, rows);
}

export type RequestResult = "sent" | "accepted" | "already";

/**
 * Asks `otherId` to connect. A request the other person already sent me is accepted instead; a
 * request they ignored can be sent again.
 */
export async function requestConnection(
  db: PrismaClient,
  userId: string,
  otherId: string,
  now = new Date(),
): Promise<RequestResult> {
  if (userId === otherId) throw new ConnectionError("self");
  const other = await db.user.findFirst({
    where: { id: otherId, ...findablePeopleWhere },
    select: { id: true },
  });
  if (!other) throw new ConnectionError("notFound");
  const existing = await db.connection.findFirst({ where: pair(userId, otherId) });
  if (existing?.status === "blocked") throw new ConnectionError("blocked");
  if (existing?.status === "accepted") return "already";
  if (existing?.status === "pending") {
    if (existing.requesterId === userId) return "already";
    await acceptConnection(db, userId, existing.id, now);
    return "accepted";
  }
  if (existing) {
    // Ignored or removed earlier: a new request, from whoever asks now.
    await db.connection.update({
      where: { id: existing.id },
      data: {
        requesterId: userId,
        addresseeId: otherId,
        status: "pending",
        createdAt: now,
        respondedAt: null,
      },
    });
  } else {
    await db.connection.create({
      data: { requesterId: userId, addresseeId: otherId, createdAt: now },
    });
  }
  await tell(db, userId, otherId, "connectionRequest", "/app/messages/connexions");
  return "sent";
}

/** The bell of `to`: « {name} vous demande en connexion », « {name} a accepté… ». */
async function tell(
  db: PrismaClient,
  fromId: string,
  toId: string,
  type: "connectionRequest" | "connectionAccepted",
  href: string,
) {
  const from = await db.user.findUnique({ where: { id: fromId }, select: { name: true } });
  if (!from) return;
  await notify(db, { userIds: [toId], type, payload: { name: from.name }, href });
}

/** Accepts a request I received; the conversation between us opens (or reopens). */
export async function acceptConnection(
  db: PrismaClient,
  userId: string,
  connectionId: string,
  now = new Date(),
) {
  const connection = await db.connection.findFirst({
    where: { id: connectionId, addresseeId: userId, status: "pending" },
  });
  if (!connection) throw new ConnectionError("notFound");
  await db.connection.update({
    where: { id: connection.id },
    data: { status: "accepted", respondedAt: now },
  });
  const conversation = await db.conversation.findUnique({
    where: { connectionId: connection.id },
  });
  const id = conversation?.id ?? (await openPeerConversation(db, connection, now));
  await tell(db, userId, connection.requesterId, "connectionAccepted", `/app/messages/${id}`);
  return id;
}

async function openPeerConversation(
  db: PrismaClient,
  connection: { id: string; requesterId: string; addresseeId: string },
  now: Date,
) {
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
}

/** Ignores a request I received: the requester is not told. */
export async function ignoreConnection(
  db: PrismaClient,
  userId: string,
  connectionId: string,
  now = new Date(),
) {
  const { count } = await db.connection.updateMany({
    where: { id: connectionId, addresseeId: userId, status: "pending" },
    data: { status: "declined", respondedAt: now },
  });
  if (count === 0) throw new ConnectionError("notFound");
}

/**
 * Removes a connection (or withdraws a request I sent). Nothing is deleted: the conversation stays
 * readable for both, and no one can write in it any more.
 */
export async function removeConnection(
  db: PrismaClient,
  userId: string,
  connectionId: string,
  now = new Date(),
) {
  const { count } = await db.connection.updateMany({
    where: {
      id: connectionId,
      OR: [
        { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
        { status: "pending", requesterId: userId },
      ],
    },
    data: { status: "declined", respondedAt: now },
  });
  if (count === 0) throw new ConnectionError("notFound");
}

/** Blocks the other person of a connection or a request: no request, no message, both ways. */
export async function blockConnection(
  db: PrismaClient,
  userId: string,
  connectionId: string,
  now = new Date(),
) {
  const { count } = await db.connection.updateMany({
    where: {
      id: connectionId,
      status: { not: "blocked" },
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    data: { status: "blocked", blockedById: userId, respondedAt: now },
  });
  if (count === 0) throw new ConnectionError("notFound");
}

/** The other person of one of my connections or requests, to report them. */
export async function connectionPeer(db: PrismaClient, userId: string, connectionId: string) {
  const connection = await db.connection.findFirst({
    where: { id: connectionId, OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: {
      requesterId: true,
      addresseeId: true,
      requester: { select: { talentProfile: { select: { id: true } } } },
      addressee: { select: { talentProfile: { select: { id: true } } } },
    },
  });
  if (!connection) return null;
  const other = connection.requesterId === userId ? connection.addressee : connection.requester;
  return other.talentProfile?.id ?? null;
}
