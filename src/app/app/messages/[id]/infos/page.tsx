import { redirect } from "next/navigation";

/**
 * « Infos » of a conversation: replaced by the menu ··· of the Chat (docs/chat-v2 § Menu). An old
 * link opens the conversation.
 */
export default async function InfosPage({ params }: PageProps<"/app/messages/[id]/infos">) {
  const { id } = await params;
  redirect(`/app/messages/${id}`);
}
