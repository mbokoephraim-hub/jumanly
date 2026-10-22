import "server-only";
import { db } from "@/server/db";
import { phoneInbox, type InboxItem } from "@/server/services/messages-phone";
import type { OrbiFactAnswer, OrbiFactCard } from "@/server/actions/feed";
import { messageWords, recruiterTitles, titleOf } from "./data";

export const MESSAGE_FACTS = ["nonlus", "prioritaire", "recruteur", "relire"] as const;
export type MessageFact = (typeof MESSAGE_FACTS)[number];

/**
 * Orbi's answers on the Messages tab (lot B8, planche Messages-orbi-liste), built from the
 * person's own conversations, without a credit: who wrote and has not been read, whom to answer
 * first (a recruiter before a connection, the oldest waiting first), how to write. Orbi never
 * answers for the person.
 */
export async function messagesFact(
  fact: MessageFact,
  user: { id: string; showPresence: boolean },
  question: string,
): Promise<OrbiFactAnswer> {
  const now = new Date();
  const [items, words] = await Promise.all([
    phoneInbox(db, user.id, now),
    messageWords({ showPresence: user.showPresence }, now),
  ]);
  const titles = await recruiterTitles(db, items);
  const { t } = words;
  const card = (item: InboxItem): OrbiFactCard => {
    const row = words.row(item, user.id, titleOf(titles, item));
    return {
      href: `/app/messages/${item.id}`,
      title: row.who.name,
      sub: row.preview,
      initials: row.who.initials,
      image: row.who.image,
      tone: row.who.tone,
      org: row.who.org,
    };
  };
  // Waiting for an answer: the last message is theirs and not read.
  const waiting = items.filter(
    (item) =>
      item.unread > 0 && item.last && item.last.senderId !== user.id && item.last.kind !== "system",
  );
  switch (fact) {
    case "nonlus":
      return {
        question,
        text: waiting.length
          ? t("orbi.unread", {
              count: waiting.reduce((sum, item) => sum + item.unread, 0),
              people: waiting.length,
            })
          : t("orbi.unreadNone"),
        cards: waiting.slice(0, 5).map(card),
        action: null,
      };
    case "prioritaire": {
      const rank = (item: InboxItem) =>
        item.tab === "recruteurs" ? 0 : item.tab === "connexions" ? 1 : 2;
      const first = [...waiting].sort(
        (a, b) => rank(a) - rank(b) || a.last!.createdAt.getTime() - b.last!.createdAt.getTime(),
      )[0];
      if (!first) return { question, text: t("orbi.priorityNone"), cards: [], action: null };
      const row = words.row(first, user.id, titleOf(titles, first));
      return {
        question,
        text:
          first.tab === "recruteurs"
            ? t("orbi.priorityRecruiter", { name: row.who.name, company: row.who.line })
            : t("orbi.priority", { name: row.who.name, when: row.time }),
        cards: [card(first)],
        action: {
          href: `/app/messages/${first.id}`,
          label: t("orbi.answer", { name: row.who.first }),
        },
      };
    }
    case "recruteur": {
      const recruiters = items.filter((item) => item.tab === "recruteurs");
      return {
        question,
        text: recruiters.length ? t("orbi.recruiter") : t("orbi.recruiterNone"),
        cards: recruiters.slice(0, 3).map(card),
        action: recruiters.length ? null : { href: "/app/jobs", label: t("orbi.seeOffers") },
      };
    }
    case "relire":
      return { question, text: t("orbi.reread"), cards: [], action: null };
  }
}
