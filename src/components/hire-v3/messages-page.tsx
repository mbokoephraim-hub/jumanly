import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { ConnectError } from "@/server/services/connect";
import { HireError, type HireContext } from "@/server/services/hire";
import {
  candidateConversation,
  colleagueConversation,
  composerTemplates,
  messagesInbox,
  type MessageTab,
} from "@/server/services/hire-v3-messages";
import { HireV3Messages, MESSAGE_TAB_SLUGS } from "./messages";

const idOf = (value: string | string[] | undefined) =>
  typeof value === "string" && /^[\w-]{1,60}$/.test(value) ? value : null;

/**
 * The data of « Messages » (lot 5): the list, then the conversation in the address (`?c=` for a
 * candidate, `?equipe=` for a colleague), or the newest one of the tab.
 */
export async function HireV3MessagesPage({
  ctx,
  params,
}: {
  ctx: HireContext;
  params: Record<string, string | string[] | undefined>;
}) {
  const tab: MessageTab =
    (Object.keys(MESSAGE_TAB_SLUGS) as MessageTab[]).find(
      (key) => MESSAGE_TAB_SLUGS[key] !== null && MESSAGE_TAB_SLUGS[key] === params.onglet,
    ) ?? "all";
  const inbox = await messagesInbox(db, ctx);
  let candidateId = idOf(params.c);
  let teamId = idOf(params.equipe);
  if (!candidateId && !teamId) {
    const first = inbox.rows.find(
      (row) => tab === "all" || (tab === "team" ? row.tab === "equipe" : row.tab === "candidats"),
    );
    if (first?.tab === "equipe") teamId = first.id;
    else if (first) candidateId = first.id;
  }
  const guard = (error: unknown): never => {
    if (error instanceof ConnectError || error instanceof HireError) notFound();
    throw error;
  };
  const [candidate, colleague, templates] = await Promise.all([
    candidateId ? candidateConversation(db, ctx, candidateId).catch(guard) : null,
    !candidateId && teamId ? colleagueConversation(db, ctx, teamId).catch(guard) : null,
    composerTemplates(db, ctx),
  ]);
  // Read now: the list shows no unread mark for the conversation just opened.
  const rows = inbox.rows.map((row) =>
    row.id === candidate?.id || row.id === colleague?.id ? { ...row, unread: 0 } : row,
  );
  const unread = rows.filter((row) => row.unread > 0);
  return (
    <HireV3Messages
      tab={tab}
      inbox={{
        rows,
        unreadConversations: unread.length,
        unreadMessages: unread.reduce((sum, row) => sum + row.unread, 0),
      }}
      candidate={candidate}
      colleague={colleague}
      templates={templates}
      query={params}
    />
  );
}
