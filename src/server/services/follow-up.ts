/**
 * Suivi (docs/ux-mobile-talent, prompt 2): what the talent has to act on, counted from real data
 * only. One action per thing to do, never twice:
 * - an interview the team proposed and the talent has not answered yet (`pending`, a slot to come);
 * - a document the team asked for and the talent has not sent yet;
 * - a conversation with an unread message that is neither of the above.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { listConversations } from "./connect";

export type FollowUpActions = {
  interviews: number;
  documents: number;
  messages: number;
  total: number;
};

export async function followUpActions(
  db: PrismaClient,
  userId: string,
  now = new Date(),
): Promise<FollowUpActions> {
  const [pending, requests, conversations] = await Promise.all([
    db.interview.findMany({
      where: { application: { profile: { userId } }, status: "pending", slots: { isEmpty: false } },
      select: { slots: true, application: { select: { conversation: { select: { id: true } } } } },
    }),
    db.message.findMany({
      where: {
        kind: "document_request",
        hiddenAt: null,
        conversation: { talentUserId: userId, blockedAt: null },
      },
      select: { conversationId: true, payload: true },
    }),
    listConversations(db, { userId }),
  ]);

  const interviews = pending.filter((interview) => interview.slots.some((slot) => slot >= now));
  const documents = requests.filter((request) => {
    const payload = (request.payload ?? {}) as { submittedAt?: unknown };
    return !payload.submittedAt;
  });
  const counted = new Set<string>([
    ...documents.map((request) => request.conversationId),
    ...interviews.flatMap((interview) =>
      interview.application.conversation ? [interview.application.conversation.id] : [],
    ),
  ]);
  const messages = conversations.filter(
    (conversation) => conversation.unread && !counted.has(conversation.id),
  ).length;
  return {
    interviews: interviews.length,
    documents: documents.length,
    messages,
    total: interviews.length + documents.length + messages,
  };
}
