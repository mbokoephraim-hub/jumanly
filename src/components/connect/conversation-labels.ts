import type { listConversations, Viewer } from "@/server/services/connect";

type Conversation = Awaited<ReturnType<typeof listConversations>>[number];

/** Name of the other side and the job of a conversation, as the search results show them. */
export function conversationLabels(conversation: Conversation, viewer: Viewer) {
  const name = viewer.hire
    ? (conversation.application?.profile.user.name ??
      conversation.contactRequest?.profile.user.name ??
      "")
    : (conversation.organization?.name ?? "");
  const job =
    conversation.application?.job.title ?? conversation.contactRequest?.job?.title ?? null;
  return { name, job };
}
