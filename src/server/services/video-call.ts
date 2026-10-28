/**
 * Video calls of the talent's Chat (docs/chat-v2 § Appel vidéo): « Souhaitez-vous appeler… en
 * vidéo ? », the ring, the call, « Appel terminé · durée ».
 *
 * - Only between two connections, or with the recruiter of an application who wrote in it; never
 *   in a blocked conversation.
 * - Nothing of the call is recorded: only who called, when, and how long, kept in `VideoCall`; a
 *   line « Appel vidéo · 12 min 40 s » is written in the conversation when it ends.
 * - The provider is behind `VideoCallProvider` (fake by default).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { videoCallProvider, type VideoCallProvider } from "@/server/adapters/video-call";
import { RING_MAX_MS } from "@/lib/call-duration";
import { ConnectError } from "./connect";
import { phoneConversation, type PhoneConversation } from "./messages-phone";

export { RING_MAX_MS } from "@/lib/call-duration";

/** Whether the talent may call in this conversation (its rule, without reading it again). */
export function callAllowed(
  conversation: Pick<PhoneConversation, "kind" | "blocked" | "canWrite" | "item">,
) {
  if (conversation.blocked || !conversation.canWrite) return false;
  if (conversation.kind === "peer") return true;
  // With an organization: only with the recruiter who wrote, in an application.
  return conversation.kind === "application" && conversation.item.counterpart.kind === "person";
}

/** « Oui, appeler »: the call rings. */
export async function startCall(
  db: PrismaClient,
  userId: string,
  conversationId: string,
  options: { now?: Date; provider?: VideoCallProvider } = {},
) {
  const now = options.now ?? new Date();
  const provider = options.provider ?? videoCallProvider();
  const conversation = await phoneConversation(db, userId, conversationId, now);
  if (!callAllowed(conversation)) throw new ConnectError("blocked");
  // A call left ringing elsewhere is closed first: one call at a time per person.
  await db.videoCall.updateMany({
    where: { callerId: userId, status: { in: ["ringing", "active"] } },
    data: { status: "missed", endedAt: now },
  });
  const call = await db.videoCall.create({
    data: { conversationId, callerId: userId, provider: provider.id, roomId: "", createdAt: now },
  });
  const room = await provider.openRoom(call.id);
  await db.videoCall.update({ where: { id: call.id }, data: { roomId: room.roomId } });
  return { callId: call.id, token: room.token, autoAnswerMs: provider.autoAnswerMs };
}

async function ownCall(db: PrismaClient, userId: string, callId: string) {
  const call = await db.videoCall.findFirst({ where: { id: callId, callerId: userId } });
  if (!call) throw new ConnectError("notFound");
  return call;
}

/** The other side picked up (with the fake provider, after its short ring). */
export async function answerCall(
  db: PrismaClient,
  userId: string,
  callId: string,
  now = new Date(),
) {
  const call = await ownCall(db, userId, callId);
  if (call.status !== "ringing") return;
  if (now.getTime() - call.createdAt.getTime() > RING_MAX_MS) throw new ConnectError("invalid");
  await db.videoCall.update({
    where: { id: callId },
    data: { status: "active", answeredAt: now },
  });
}

/**
 * « Raccrocher »: the call ends, the room closes, and the conversation keeps a line with its
 * length (or « sans réponse »). Returns the seconds spoken, null when nobody answered.
 */
export async function endCall(
  db: PrismaClient,
  userId: string,
  callId: string,
  line: (seconds: number | null) => string,
  options: { now?: Date; provider?: VideoCallProvider } = {},
) {
  const now = options.now ?? new Date();
  const provider = options.provider ?? videoCallProvider();
  const call = await ownCall(db, userId, callId);
  if (call.status === "ended" || call.status === "missed") {
    return call.answeredAt && call.endedAt
      ? Math.round((call.endedAt.getTime() - call.answeredAt.getTime()) / 1000)
      : null;
  }
  const seconds = call.answeredAt
    ? Math.max(1, Math.round((now.getTime() - call.answeredAt.getTime()) / 1000))
    : null;
  await provider.closeRoom(call.roomId);
  await db.$transaction([
    db.videoCall.update({
      where: { id: callId },
      data: { status: seconds === null ? "missed" : "ended", endedAt: now },
    }),
    db.message.create({
      data: {
        conversationId: call.conversationId,
        senderId: null,
        kind: "system",
        body: line(seconds),
        payload: { call: { by: userId, seconds } },
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
