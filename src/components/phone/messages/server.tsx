import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { ConnectError, markRead } from "@/server/services/connect";
import { touchPresence } from "@/server/services/hire-messaging";
import {
  phoneConnections,
  phoneConversation,
  phoneInbox,
  phoneRequests,
} from "@/server/services/messages-phone";
import { shortName } from "../fil/data";
import {
  attachments,
  messageViews,
  messageWords,
  nextDays,
  recruiterTitles,
  titleOf,
} from "./data";
import { PhoneMessages } from "./inbox";
import { PhoneThread } from "./thread";
import type { InboxView, ThreadView } from "./types";

type Viewer = { id: string; showPresence: boolean };

/** The texts the screens of Messages need in the browser. */
export async function MessagesTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["phoneMsg", "phone"])}>
      {children}
    </NextIntlClientProvider>
  );
}

/** The three rubrics, the requests and the connections, worded for the phone. */
export async function inboxView(user: Viewer, now = new Date()): Promise<InboxView> {
  const [items, requests, connections, words] = await Promise.all([
    phoneInbox(db, user.id, now),
    phoneRequests(db, user.id, now),
    phoneConnections(db, user.id),
    messageWords(user, now),
  ]);
  const titles = await recruiterTitles(db, items);
  return {
    rows: items.map((item) => words.row(item, user.id, titleOf(titles, item))),
    connections: connections.map((row) => ({
      connectionId: row.connectionId,
      conversationId: row.conversationId,
      who: words.ofPerson(row.person, null),
    })),
    requests: requests.connections.map((row) => ({
      id: row.id,
      who: words.ofPerson(row.requester, null),
      note: row.note,
    })),
    orgRequests: requests.contacts.map((row) => ({
      id: row.id,
      who: words.ofOrganization(row.organization),
      note: row.message,
      job: row.job?.title ?? null,
    })),
  };
}

/**
 * The Messages tab, kept mounted under the pages (brief § 3): the three rubrics, the requests,
 * the connections for « Nouveau message » and the search, read at once while the logo shows.
 */
export async function MessagesTab({ user }: { user: Viewer }) {
  const view = await inboxView(user);
  return (
    <MessagesTexts>
      <PhoneMessages view={view} />
    </MessagesTexts>
  );
}

/** One conversation as its talent sees it on the phone, with what « Joindre » offers. */
export async function threadView(user: Viewer, conversationId: string, now = new Date()) {
  const conversation = await phoneConversation(db, user.id, conversationId, now);
  const [words, items] = await Promise.all([messageWords(user, now), phoneInbox(db, user.id, now)]);
  const titles = await recruiterTitles(db, [conversation.item, ...items]);
  const who = words.ofCounterpart(
    conversation.item.counterpart,
    titleOf(titles, conversation.item),
  );
  const counterpart = conversation.item.counterpart;
  const otherUserId =
    conversation.kind === "peer" && counterpart.kind === "person" ? counterpart.person.id : null;
  const [messages, joined] = await Promise.all([
    messageViews(db, words, conversation, user.id, who),
    attachments(db, words, user.id, otherUserId),
  ]);
  const company =
    counterpart.kind === "organization"
      ? shortName(counterpart.organization.name)
      : counterpart.organization
        ? shortName(counterpart.organization.name)
        : null;
  const view: ThreadView = {
    id: conversationId,
    kind: conversation.kind === "peer" ? "peer" : "organization",
    who,
    company,
    muted: conversation.muted,
    ephemeral: conversation.ephemeralSeconds,
    blocked: conversation.blocked,
    blockedByMe: conversation.blockedByMe,
    canWrite: conversation.canWrite,
    messages,
    ...joined,
    days: nextDays(words, now),
    forwardTo: items
      .filter((item) => item.id !== conversationId && item.tab !== "entreprises")
      .map((item) => ({
        id: item.id,
        who: words.ofCounterpart(item.counterpart, titleOf(titles, item)),
      })),
    exportName: `Discussion_${who.name.replace(/\s+/g, "_")}`,
  };
  return { view, conversation };
}

async function loadThread(user: Viewer, id: string) {
  try {
    return await threadView(user, id);
  } catch (error) {
    if (error instanceof ConnectError) notFound();
    throw error;
  }
}

/** `/app/messages/[id]` on a phone: the conversation, read when opened. */
export async function PhoneThreadPage({ user, id }: { user: Viewer; id: string }) {
  const { view } = await loadThread(user, id);
  await Promise.all([markRead(db, { userId: user.id }, id), touchPresence(db, user.id)]);
  return (
    <MessagesTexts>
      <PhoneThread view={view} />
    </MessagesTexts>
  );
}

export { loadThread };
