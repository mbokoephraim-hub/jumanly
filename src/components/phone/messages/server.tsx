import "server-only";
import { clockParts } from "@/lib/clock-parts";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { ConnectError, markRead } from "@/server/services/connect";
import { touchPresence } from "@/server/services/hire-messaging";
import { suggestReplies } from "@/server/services/chat";
import {
  phoneConnections,
  phoneConversation,
  phoneInbox,
  phoneRequests,
  type PhoneConversation,
} from "@/server/services/messages-phone";
import { connectionsHub } from "@/server/services/connections-hub";
import { callAllowed } from "@/server/services/video-call";
import { initialsOf, shortName } from "../fil/data";
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
import type { ConnexionsView, InboxView, MutualView, ThreadView } from "./types";

type Viewer = { id: string; showPresence: boolean };

/** The texts the screens of Messages need in the browser. */
export async function MessagesTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, ["phoneMsg", "phoneChat", "phoneCx", "phone"])}
    >
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
 * « Connexions » of the Chat (Ephraïm 29/10/2026): the requests, the suggestions and my
 * connections, worded for the phone.
 */
export async function connexionsView(user: Viewer, now = new Date()): Promise<ConnexionsView> {
  const [hub, requests, words, format, t] = await Promise.all([
    connectionsHub(db, user.id),
    phoneRequests(db, user.id, now),
    messageWords(user, now),
    getFormatter(),
    getTranslations("phoneCx"),
  ]);
  const ago = (date: Date) => format.relativeTime(date, now);
  const mutual = (ids: string[]): MutualView => {
    const known = ids.flatMap((id) => {
      const person = hub.people.get(id);
      return person ? [{ key: id, who: words.ofPerson(person, null) }] : [];
    });
    const first = known[0];
    return {
      count: known.length,
      text: first ? t("mutual", { name: first.who.first, rest: known.length - 1 }) : "",
      faces: known.slice(0, 3),
    };
  };
  return {
    received: hub.received.map((row) => ({
      id: row.id,
      who: words.ofPerson(row.person, null),
      note: row.note,
      ago: ago(row.at),
      mutual: mutual(row.mutual),
    })),
    orgRequests: requests.contacts.map((row) => ({
      id: row.id,
      who: words.ofOrganization(row.organization),
      note: row.message,
      job: row.job?.title ?? null,
    })),
    sent: hub.sent.map((row) => ({
      id: row.id,
      who: words.ofPerson(row.person, null),
      ago: ago(row.at),
    })),
    connections: hub.connections.map((row) => ({
      connectionId: row.connectionId,
      conversationId: row.conversationId,
      who: words.ofPerson(row.person, null),
      since: ago(row.since),
      mutual: mutual(row.mutual),
    })),
    suggestions: hub.suggestions.map((row) => ({
      who: words.ofPerson(row.person, null),
      mutual: mutual(row.mutual),
      reason: row.reason,
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

/** The words of a suggestion: « Je vous l’envoie tout de suite », « Merci, je serai là… ». */
async function suggestionTexts(
  conversation: PhoneConversation,
  userId: string,
  interviews: { mode: string; status: string; startsAt: Date | null; timezone: string }[],
) {
  const t = await getTranslations("phoneChat.suggest");
  const format = await getFormatter();
  const peer = conversation.kind === "peer";
  const lastTheirs = [...conversation.messages]
    .reverse()
    .find(
      (message) =>
        message.senderId !== userId &&
        message.senderId !== null &&
        !message.hiddenAt &&
        message.kind !== "system" &&
        message.kind !== "decision",
    );
  const interview = interviews.at(-1) ?? null;
  const keys = suggestReplies({
    peer,
    last: lastTheirs ? { kind: lastTheirs.kind, body: lastTheirs.body } : null,
    interview: interview
      ? {
          confirmed: interview.status === "confirmed" && interview.startsAt !== null,
          onSite: interview.mode === "onsite",
          video: interview.mode === "video",
        }
      : null,
  });
  const when = () => {
    const date = interview?.startsAt;
    if (!date) return "none";
    const zone = { timeZone: interview.timezone };
    const day = format.dateTime(date, { weekday: "long", ...zone });
    const { hour, minute } = clockParts(date, zone.timeZone);
    return t("when", { day, hour, minute: minute ? String(minute).padStart(2, "0") : "none" });
  };
  const mine = new Set(
    conversation.messages
      .filter((message) => message.senderId === userId)
      .map((message) => message.body.trim()),
  );
  return keys
    .map((key) =>
      key === "there" ? t("there", { when: when() }) : t(key, { peer: peer ? "yes" : "no" }),
    )
    .filter((text) => !mine.has(text));
}

/** One conversation as its talent sees it on the phone, with what « Joindre » offers. */
export async function threadView(user: Viewer, conversationId: string, now = new Date()) {
  const conversation = await phoneConversation(db, user.id, conversationId, now);
  const [words, items, tch] = await Promise.all([
    messageWords(user, now),
    phoneInbox(db, user.id, now),
    getTranslations("phoneChat"),
  ]);
  const titles = await recruiterTitles(db, [conversation.item, ...items]);
  const who = words.ofCounterpart(
    conversation.item.counterpart,
    titleOf(titles, conversation.item),
  );
  const interviewIds = conversation.messages.flatMap((message) => {
    const value = (message.payload as { interviewId?: unknown } | null)?.interviewId;
    return message.kind === "invitation" && typeof value === "string" ? [value] : [];
  });
  const [messages, joined, interviews] = await Promise.all([
    messageViews(db, words, conversation, user.id, who),
    attachments(db, words, user.id),
    interviewIds.length
      ? db.interview.findMany({
          where: { id: { in: interviewIds } },
          orderBy: { createdAt: "asc" },
          select: { mode: true, status: true, startsAt: true, timezone: true },
        })
      : Promise.resolve([]),
  ]);
  const application = conversation.application;
  const company = application ? shortName(application.organization) : null;
  const stage =
    application?.status === "active"
      ? tch(`stage.${application.stage}`)
      : application
        ? tch(`stage.${application.status}`)
        : "";
  const view: ThreadView = {
    id: conversationId,
    kind: conversation.kind === "peer" ? "peer" : "organization",
    who,
    muted: conversation.muted,
    ephemeral: conversation.ephemeralSeconds,
    blocked: conversation.blocked,
    blockedByMe: conversation.blockedByMe,
    canWrite: conversation.canWrite,
    messages,
    context:
      application && company
        ? {
            initials: initialsOf(company),
            title: tch("context.title", { job: application.job, company }),
            line:
              application.score !== null
                ? tch("context.stage", { stage, score: application.score })
                : tch("context.stageOnly", { stage }),
            href: `/app/suivi/${application.id}`,
          }
        : null,
    applicationHref: application ? `/app/suivi/${application.id}` : null,
    callLine: application ? tch("call.context", { job: application.job }) : who.line,
    canCall: callAllowed(conversation),
    pinned: conversation.item.pinned,
    typing: conversation.item.typing,
    suggestions: conversation.canWrite
      ? await suggestionTexts(conversation, user.id, interviews)
      : [],
    me: { initials: initialsOf(conversation.viewer.name) },
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
