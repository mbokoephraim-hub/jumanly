/**
 * Messages of a talent (planche talent-2 § 5): each conversation with the company, the person who
 * writes from its side and the last message; or the other talent of a connection. Orbi never reads them.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { listConversations, peerOf } from "./connect";

export async function talentInbox(db: PrismaClient, userId: string) {
  const conversations = await listConversations(db, { userId, hire: null });
  const ids = conversations.map((conversation) => conversation.id);
  // The latest person who wrote from the organization, per conversation.
  const writers =
    ids.length === 0
      ? []
      : await db.message.findMany({
          where: {
            conversationId: { in: ids },
            senderId: { not: userId },
            NOT: { senderId: null },
          },
          orderBy: { createdAt: "desc" },
          distinct: ["conversationId"],
          select: { conversationId: true, senderId: true },
        });
  const people = await db.user.findMany({
    where: { id: { in: writers.map((row) => row.senderId!) } },
    select: { id: true, name: true },
  });
  const names = new Map(people.map((person) => [person.id, person.name]));
  const writerOf = new Map(writers.map((row) => [row.conversationId, names.get(row.senderId!)]));
  // How many messages from the other side came after the talent last read the conversation.
  const counts = await Promise.all(
    conversations.map((conversation) =>
      conversation.unread
        ? db.message.count({
            where: {
              conversationId: conversation.id,
              hiddenAt: null,
              senderId: { not: userId },
              ...(conversation.participants[0]?.lastReadAt
                ? { createdAt: { gt: conversation.participants[0].lastReadAt } }
                : {}),
            },
          })
        : 0,
    ),
  );
  return conversations.map((conversation, index) => {
    // A conversation with a connection (lot 6) shows the other person, as a company would.
    const peer = conversation.kind === "peer" ? peerOf(conversation, userId) : null;
    return {
      id: conversation.id,
      company: peer?.name ?? conversation.organization?.name ?? "",
      logo: peer ? peer.image : (conversation.organization?.logo ?? null),
      person: peer ? null : (writerOf.get(conversation.id) ?? null),
      job: conversation.application?.job.title ?? conversation.contactRequest?.job?.title ?? null,
      last: conversation.last,
      unread: counts[index]!,
    };
  });
}

export type InboxRow = Awaited<ReturnType<typeof talentInbox>>[number];
