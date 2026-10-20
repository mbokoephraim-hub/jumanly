/**
 * The living recruiter messaging (brief recruteur § 2.19, planches recruteur-4 § 3 `MSG_R`,
 * `CONV_R`, `CONV_MENU`, `NETT`): « En ligne », « Distribué » / « Lu », pin, mute, « Retirer de ma
 * messagerie » and Orbi's clean-up of the finished conversations of the non retained.
 *
 * - Presence and read receipts are each person's choice (`User.showPresence`, `User.readReceipts`)
 *   and reciprocal: who hides theirs does not see the others'.
 * - Removing a conversation hides it on the organization's side only; the talent keeps every
 *   message and nothing is deleted. A new message brings it back (`sendMessage`).
 * - Golden rule n° 6: every conversation is read through the member's organization.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { HireError, hirePermissions, type HireContext } from "./hire";

/** Seen within this delay: « En ligne ». */
export const ONLINE_MS = 5 * 60_000;
/** The last visit is written at most once a minute. */
const TOUCH_MS = 60_000;
/** A conversation of a non retained candidate quiet for this long can be removed (planche NETT). */
export const CLEANUP_AFTER_MS = 30 * 86_400_000;

/** Called on each page of the space: writes the last visit, at most once a minute. */
export async function touchPresence(db: PrismaClient, userId: string, now = new Date()) {
  await db.user.updateMany({
    where: {
      id: userId,
      OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(now.getTime() - TOUCH_MS) } }],
    },
    data: { lastSeenAt: now },
  });
}

export function isOnline(
  person: { lastSeenAt: Date | null; showPresence: boolean } | null,
  viewer: { showPresence: boolean },
  now = new Date(),
) {
  if (!person || !person.showPresence || !viewer.showPresence || !person.lastSeenAt) return false;
  return now.getTime() - person.lastSeenAt.getTime() < ONLINE_MS;
}

/**
 * « Distribué » or « Lu » under the organization's last message: « Lu » only when the talent opened
 * the conversation after it and both sides keep read receipts on.
 */
export function receiptOf(
  message: { createdAt: Date } | null,
  talent: { readReceipts: boolean; lastReadAt: Date | null } | null,
  viewer: { readReceipts: boolean },
): "read" | "delivered" | null {
  if (!message || !talent) return null;
  if (!talent.readReceipts || !viewer.readReceipts) return "delivered";
  return talent.lastReadAt && talent.lastReadAt >= message.createdAt ? "read" : "delivered";
}

export const conversationActions = ["pin", "unpin", "mute", "unmute", "hide"] as const;
export type ConversationAction = (typeof conversationActions)[number];

async function orgConversation(db: PrismaClient, ctx: HireContext, id: string) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const conversation = await db.conversation.findFirst({
    where: { id, organizationId: ctx.organizationId, kind: { not: "peer" } },
    select: { id: true },
  });
  if (!conversation) throw new HireError("notFound");
  return conversation;
}

/**
 * The menu of a conversation: pin it for the whole team, mute it for oneself, or remove it from
 * the organization's list. Everything is undone the same way; nothing is deleted.
 */
export async function conversationAction(
  db: PrismaClient,
  ctx: HireContext,
  id: string,
  action: ConversationAction,
  now = new Date(),
) {
  const conversation = await orgConversation(db, ctx, id);
  if (action === "pin" || action === "unpin") {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { orgPinnedAt: action === "pin" ? now : null },
    });
  } else if (action === "mute" || action === "unmute") {
    await db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: ctx.userId } },
      update: { mutedAt: action === "mute" ? now : null },
      create: {
        conversationId: conversation.id,
        userId: ctx.userId,
        mutedAt: action === "mute" ? now : null,
      },
    });
  } else {
    if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
    await db.conversation.update({
      where: { id: conversation.id },
      data: { orgHiddenAt: now, orgPinnedAt: null },
    });
  }
}

/**
 * Orbi's clean-up (planche `NETT`): the conversations of non retained or withdrawn candidates with
 * nothing new for 30 days. Orbi only proposes; the member ticks and confirms.
 */
export async function cleanupCandidates(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).manage) return [];
  const rows = await db.conversation.findMany({
    where: {
      organizationId: ctx.organizationId,
      kind: { not: "peer" },
      orgHiddenAt: null,
      lastMessageAt: { lt: new Date(now.getTime() - CLEANUP_AFTER_MS) },
      application: { status: { in: ["rejected", "withdrawn"] } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      lastMessageAt: true,
      application: {
        select: {
          status: true,
          job: { select: { title: true } },
          profile: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.application?.profile.user.name ?? "",
    job: row.application?.job.title ?? "",
    status: row.application?.status ?? "rejected",
    at: row.lastMessageAt,
  }));
}

/** « Retirer » the conversations ticked in Orbi's clean-up; only those it proposed. */
export async function hideConversations(
  db: PrismaClient,
  ctx: HireContext,
  ids: string[],
  now = new Date(),
) {
  const allowed = new Set((await cleanupCandidates(db, ctx, now)).map((row) => row.id));
  const chosen = ids.filter((id) => allowed.has(id)).slice(0, 50);
  if (chosen.length === 0) return 0;
  const done = await db.conversation.updateMany({
    where: { id: { in: chosen }, organizationId: ctx.organizationId },
    data: { orgHiddenAt: now, orgPinnedAt: null },
  });
  return done.count;
}
