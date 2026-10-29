/**
 * Calls of the talent's Chat (docs/chat-v2 § Appel vidéo), in audio or in video: « Souhaitez-vous
 * appeler… ? », the ring on both phones, « Accepter en audio » or « en vidéo », the call,
 * « Appel terminé · durée ».
 *
 * - Only between two connections, or with the recruiter of an application who wrote in it; never
 *   in a blocked conversation.
 * - Nothing of the call is recorded: only who called whom, when, how and how long, kept in
 *   `VideoCall`; a line « Appel vidéo · 12 min 40 s » is written in the conversation when it ends.
 *   The two connection descriptions (SDP) are passed while it rings and wiped when it ends.
 * - The provider is behind `VideoCallProvider` (WebRTC, or fake in local).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { videoCallProvider, type VideoCallProvider } from "@/server/adapters/video-call";
import { RING_MAX_MS } from "@/lib/call-duration";
import { ConnectError } from "./connect";
import { phoneConversation, type PhoneConversation } from "./messages-phone";

export { RING_MAX_MS } from "@/lib/call-duration";

export type CallMode = "audio" | "video";

/** A connection description (SDP) is a few kilobytes; anything larger is not one. */
export const SDP_MAX_LENGTH = 30_000;

/** Whether the talent may call in this conversation (its rule, without reading it again). */
export function callAllowed(
  conversation: Pick<PhoneConversation, "kind" | "blocked" | "canWrite" | "item">,
) {
  if (conversation.blocked || !conversation.canWrite) return false;
  if (conversation.kind === "peer") return true;
  // With an organization: only with the recruiter who wrote, in an application.
  return conversation.kind === "application" && conversation.item.counterpart.kind === "person";
}

/** The person called: the other talent, or the recruiter who wrote in the application. */
export function calleeOf(conversation: Pick<PhoneConversation, "item">) {
  const counterpart = conversation.item.counterpart;
  return counterpart.kind === "person" ? counterpart.person.id : null;
}

/** « Oui, appeler »: the call rings on the other side, with the caller's description. */
export async function startCall(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  options: {
    now?: Date;
    provider?: VideoCallProvider;
    mode?: CallMode;
    offer?: string | null;
  } = {},
) {
  const now = options.now ?? new Date();
  const provider = options.provider ?? videoCallProvider();
  const conversation = await phoneConversation(db, userId, conversationId, now);
  if (!callAllowed(conversation)) throw new ConnectError("blocked");
  const offer = options.offer ?? null;
  if (provider.id === "webrtc" && !offer) throw new ConnectError("invalid");
  // A call left ringing elsewhere is closed first: one call at a time per person.
  await db.videoCall.updateMany({
    where: { callerId: userId, status: { in: ["ringing", "active"] } },
    data: { status: "missed", endedAt: now, offer: null, answer: null },
  });
  const call = await db.videoCall.create({
    data: {
      conversationId,
      callerId: userId,
      calleeId: calleeOf(conversation),
      mode: options.mode ?? "video",
      offer,
      provider: provider.id,
      roomId: "",
      createdAt: now,
    },
  });
  const room = await provider.openRoom(call.id);
  await db.videoCall.update({ where: { id: call.id }, data: { roomId: room.roomId } });
  return {
    callId: call.id,
    token: room.token,
    autoAnswerMs: provider.autoAnswerMs,
    provider: provider.id,
  };
}

/**
 * The call ringing for this person, if any (asked every few seconds in the whole space): who
 * calls, how, and the caller's description to answer it.
 */
export async function incomingCall(db: PrismaClient, userId: string, now = new Date()) {
  const call = await db.videoCall.findFirst({
    where: {
      calleeId: userId,
      status: "ringing",
      provider: "webrtc",
      createdAt: { gt: new Date(now.getTime() - RING_MAX_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      conversationId: true,
      mode: true,
      offer: true,
      caller: { select: { name: true, firstName: true, image: true } },
    },
  });
  if (!call?.offer) return null;
  return {
    id: call.id,
    conversationId: call.conversationId,
    mode: (call.mode === "audio" ? "audio" : "video") as CallMode,
    offer: call.offer,
    caller: call.caller,
  };
}

async function callOf(db: PrismaClient, userId: string, callId: string) {
  const call = await db.videoCall.findFirst({
    where: { id: callId, OR: [{ callerId: userId }, { calleeId: userId }] },
  });
  if (!call) throw new ConnectError("notFound");
  return call;
}

/** Where a call stands, for one of its two sides (the caller reads the answer here). */
export async function callState(db: PrismaClient, userId: string, callId: string) {
  const call = await callOf(db, userId, callId);
  return {
    status: call.status,
    answerMode: call.answerMode === "audio" || call.answerMode === "video" ? call.answerMode : null,
    answer: call.callerId === userId ? call.answer : null,
  };
}

/** « Accepter en audio » or « en vidéo »: the person called answers with their description. */
export async function acceptCall(
  db: PrismaClient,
  userId: string,
  callId: string,
  input: { mode: CallMode; answer: string },
  now = new Date(),
) {
  const call = await db.videoCall.findFirst({ where: { id: callId, calleeId: userId } });
  if (!call) throw new ConnectError("notFound");
  if (call.status !== "ringing" || now.getTime() - call.createdAt.getTime() > RING_MAX_MS)
    throw new ConnectError("invalid");
  await db.videoCall.update({
    where: { id: callId },
    data: { status: "active", answeredAt: now, answerMode: input.mode, answer: input.answer },
  });
}

async function ownCall(db: PrismaClient, userId: string, callId: string) {
  const call = await db.videoCall.findFirst({ where: { id: callId, callerId: userId } });
  if (!call) throw new ConnectError("notFound");
  return call;
}

/** The other side picked up, with the fake provider, after its short ring. */
export async function answerCall(
  db: PrismaClient,
  userId: string,
  callId: string,
  now = new Date(),
) {
  const call = await ownCall(db, userId, callId);
  if (call.provider !== "fake") throw new ConnectError("invalid");
  if (call.status !== "ringing") return;
  if (now.getTime() - call.createdAt.getTime() > RING_MAX_MS) throw new ConnectError("invalid");
  await db.videoCall.update({
    where: { id: callId },
    data: { status: "active", answeredAt: now },
  });
}

/**
 * « Raccrocher » (either side) or « Refuser » (the person called, while it rings): the call ends,
 * the room closes, the descriptions are wiped, and the conversation keeps a line with its length
 * (or « sans réponse »). Returns the seconds spoken, null when nobody answered.
 */
export async function endCall(
  db: PrismaClient,
  userId: string,
  callId: string,
  line: (seconds: number | null, mode: CallMode) => string,
  options: { now?: Date; provider?: VideoCallProvider } = {},
) {
  const now = options.now ?? new Date();
  const provider = options.provider ?? videoCallProvider();
  const call = await callOf(db, userId, callId);
  if (call.status === "ended" || call.status === "missed") {
    return call.answeredAt && call.endedAt
      ? Math.round((call.endedAt.getTime() - call.answeredAt.getTime()) / 1000)
      : null;
  }
  const seconds = call.answeredAt
    ? Math.max(1, Math.round((now.getTime() - call.answeredAt.getTime()) / 1000))
    : null;
  // Audio when either side chose it: that is the call the two people had.
  const mode: CallMode = call.mode === "audio" || call.answerMode === "audio" ? "audio" : "video";
  await provider.closeRoom(call.roomId);
  const closed = await db.videoCall.updateMany({
    where: { id: callId, status: { in: ["ringing", "active"] } },
    data: {
      status: seconds === null ? "missed" : "ended",
      endedAt: now,
      offer: null,
      answer: null,
    },
  });
  // Both sides may hang up at the same moment: only the first one writes the line.
  if (closed.count === 0) return seconds;
  await db.$transaction([
    db.message.create({
      data: {
        conversationId: call.conversationId,
        senderId: null,
        kind: "system",
        body: line(seconds, mode),
        payload: { call: { by: call.callerId, seconds, mode } },
        createdAt: now,
      },
    }),
    db.conversation.update({
      where: { id: call.conversationId },
      data: { lastMessageAt: now },
    }),
  ]);
  return seconds;
}
