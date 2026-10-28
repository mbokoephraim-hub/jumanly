/**
 * The talent's Chat (docs/chat-v2, validated 27/10/2026): what the phone adds to Messages.
 *
 * - Live: « écrit… » while the other side types (`typingAt`, a few seconds), « En ligne » (the
 *   last visit, `touchPresence`), and a small version of the person's conversations the screen
 *   compares to know when to read them again (`chatPulse`). Presence follows each person's choice
 *   (`User.showPresence`), both ways.
 * - Reactions under a message (one per person and message), « Épingler la discussion » (for this
 *   person only).
 * - The replies Orbi suggests above the field: written by rules from the last message received,
 *   without the model and without a credit; one touch sends, nothing leaves on its own.
 * - The ring around a face: the colours of the person's first skills, or of their name.
 *
 * A talent reads only their own conversations (`talentWhere`); nothing here reaches the model.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { PROFILE_COLORS, PROFILE_PALETTE, colorOf } from "@/lib/profile-colors";
import { REACTIONS } from "@/lib/reactions";
import { ConnectError } from "./connect";
import { ONLINE_MS, touchPresence } from "./hire-messaging";
import { TYPING_MS, talentWhere, visibleWhere } from "./messages-phone";

export { TYPING_MS };

export { REACTIONS };

/** The kinds of message one can react to: what a person wrote or sent, not a line of the system. */
const REACTABLE = [
  "text",
  "file",
  "image",
  "voice",
  "contact",
  "organization",
  "slot",
  "invitation",
];

async function talentConversation(db: PrismaClient, userId: string, conversationId: string) {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, ...talentWhere(userId) },
    select: { id: true, kind: true },
  });
  if (!conversation) throw new ConnectError("notFound");
  return conversation;
}

/** A keystroke in the composer: the other side reads « écrit… » for a few seconds. */
export async function markTyping(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  now = new Date(),
) {
  await talentConversation(db, userId, conversationId);
  await db.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    update: { typingAt: now },
    create: { conversationId, userId, typingAt: now },
  });
}

/**
 * A reaction under a message, changed by touching another one, taken back by touching the same.
 * `emoji` null takes it back.
 */
export async function reactToMessage(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  messageId: string,
  emoji: string | null,
  now = new Date(),
) {
  if (emoji !== null && !(REACTIONS as readonly string[]).includes(emoji))
    throw new ConnectError("invalid");
  await talentConversation(db, userId, conversationId);
  const me = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { clearedAt: true },
  });
  const message = await db.message.findFirst({
    where: { id: messageId, conversationId, ...visibleWhere(now, me?.clearedAt ?? null) },
    select: { id: true, kind: true },
  });
  if (!message || !REACTABLE.includes(message.kind)) throw new ConnectError("notFound");
  if (emoji === null) {
    await db.messageReaction.deleteMany({ where: { messageId, userId } });
    return null;
  }
  await db.messageReaction.upsert({
    where: { messageId_userId: { messageId, userId } },
    update: { emoji, createdAt: now },
    create: { messageId, userId, emoji, createdAt: now },
  });
  return emoji;
}

/** « Épingler la discussion »: first in this person's list, until they take it off. */
export async function setPinned(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  pinned: boolean,
  now = new Date(),
) {
  await talentConversation(db, userId, conversationId);
  await db.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    update: { pinnedAt: pinned ? now : null },
    create: { conversationId, userId, pinnedAt: pinned ? now : null },
  });
}

/** The reactions of some messages, grouped: « ❤️ 1 », and whether one of them is mine. */
export async function reactionsOf(db: PrismaClient, messageIds: string[], userId: string) {
  if (messageIds.length === 0)
    return new Map<string, { emojis: string[]; count: number; mine: string | null }>();
  const rows = await db.messageReaction.findMany({
    where: { messageId: { in: messageIds } },
    orderBy: { createdAt: "asc" },
    select: { messageId: true, userId: true, emoji: true },
  });
  const map = new Map<string, { emojis: string[]; count: number; mine: string | null }>();
  for (const row of rows) {
    const entry = map.get(row.messageId) ?? { emojis: [], count: 0, mine: null };
    if (!entry.emojis.includes(row.emoji)) entry.emojis.push(row.emoji);
    entry.count += 1;
    if (row.userId === userId) entry.mine = row.emoji;
    map.set(row.messageId, entry);
  }
  return map;
}

export type ChatPulse = {
  /** Conversations where the other side is typing now. */
  typing: string[];
  /** The people of these conversations seen within five minutes (and who show it). */
  online: string[];
  /** Changes when a message, a reaction, a reading or a call changes: read the screen again. */
  version: string;
};

/**
 * What the screen asks every few seconds: who types, who is online, and whether something new
 * arrived. Also keeps the person « En ligne » while the Chat is open.
 */
export async function chatPulse(
  db: PrismaClient,
  userId: string,
  conversationId: string | null,
  now = new Date(),
): Promise<ChatPulse> {
  const [me, conversations] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { showPresence: true } }),
    db.conversation.findMany({
      where: talentWhere(userId),
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      select: {
        id: true,
        lastMessageAt: true,
        participants: {
          select: {
            userId: true,
            typingAt: true,
            lastReadAt: true,
            user: { select: { lastSeenAt: true, showPresence: true } },
          },
        },
      },
    }),
    touchPresence(db, userId, now),
  ]);
  const typing: string[] = [];
  const online = new Set<string>();
  let latest = 0;
  for (const conversation of conversations) {
    latest = Math.max(latest, conversation.lastMessageAt.getTime());
    for (const participant of conversation.participants) {
      if (participant.userId === userId) continue;
      if (participant.typingAt && now.getTime() - participant.typingAt.getTime() < TYPING_MS)
        typing.push(conversation.id);
      const seen = participant.user.lastSeenAt;
      if (
        me?.showPresence &&
        participant.user.showPresence &&
        seen &&
        now.getTime() - seen.getTime() < ONLINE_MS
      )
        online.add(participant.userId);
    }
  }
  let detail = "";
  const open = conversationId ? conversations.find((row) => row.id === conversationId) : null;
  if (open) {
    const [reactions, calls] = await Promise.all([
      db.messageReaction.aggregate({
        where: { message: { conversationId: open.id } },
        _count: true,
        _max: { createdAt: true },
      }),
      db.videoCall.count({ where: { conversationId: open.id } }),
    ]);
    const readAt = open.participants
      .filter((participant) => participant.userId !== userId)
      .map((participant) => participant.lastReadAt?.getTime() ?? 0)
      .reduce((max, value) => Math.max(max, value), 0);
    detail = `:${reactions._count}:${reactions._max.createdAt?.getTime() ?? 0}:${readAt}:${calls}`;
  }
  return {
    typing: [...new Set(typing)],
    online: [...online],
    version: `${conversations.length}:${latest}${detail}`,
  };
}

/** The ring around a face: the colours of the first five skills, or two or three of the name. */
export function ringColors(name: string, skills: string[] = []) {
  const colors: string[] = [];
  for (const skill of skills) {
    const color = PROFILE_PALETTE[colorOf(skill)];
    if (!colors.includes(color)) colors.push(color);
    if (colors.length === 5) break;
  }
  if (colors.length >= 2) return colors;
  // Without skills (a recruiter, a company): neighbouring colours drawn from the name.
  const first = colorOf(name);
  const start = PROFILE_COLORS.indexOf(first);
  const fromName = [0, 3, 5].map(
    (step) => PROFILE_PALETTE[PROFILE_COLORS[(start + step) % PROFILE_COLORS.length]!],
  );
  for (const color of fromName) if (!colors.includes(color)) colors.push(color);
  return colors.slice(0, 3);
}

// ─── Replies suggested by Orbi (rules, no model, no credit) ─────────────────────────────────

export type SuggestKey =
  | "sendNow"
  | "there"
  | "address"
  | "link"
  | "choose"
  | "yes"
  | "thanks"
  | "received"
  | "peerThanks"
  | "peerLater"
  | "peerYes";

export type SuggestInput = {
  peer: boolean;
  /** The last message of the other side, with its kind. */
  last: { kind: string; body: string } | null;
  /** The interview of the conversation, if any: confirmed or still to choose, on site or not. */
  interview: { confirmed: boolean; onSite: boolean; video: boolean } | null;
};

const asksForSomething =
  /(envoy|transmet|partag|attestation|\bcv\b|dipl[oô]me|document|certificat|copie|pi[eè]ce)/iu;

/**
 * Up to three short answers to the last message received, the most useful first. A request for
 * a document → « Je vous l’envoie tout de suite »; an interview → « Merci, je serai là… » and the
 * address or the link; a question → « Oui, bien sûr. »; otherwise a thank-you.
 */
export function suggestReplies(input: SuggestInput): SuggestKey[] {
  const keys: SuggestKey[] = [];
  const last = input.last;
  if (!last) return [];
  const body = last.body;
  if (last.kind === "document_request" || asksForSomething.test(body)) keys.push("sendNow");
  if (input.interview) {
    if (input.interview.confirmed) {
      keys.push("there");
      if (input.interview.onSite) keys.push("address");
      else if (input.interview.video) keys.push("link");
    } else keys.push("choose");
  }
  if (input.peer) {
    if (/\?\s*$/.test(body)) keys.push("peerYes");
    keys.push("peerThanks", "peerLater");
  } else {
    if (/\?\s*$/.test(body) && !keys.includes("sendNow")) keys.push("yes");
    keys.push("thanks", "received");
  }
  return [...new Set(keys)].slice(0, 3);
}
