import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { dynamic } from "@/i18n/dynamic";
import type { ReactNode } from "react";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import {
  freshMatches,
  listFeed,
  phoneNotificationFilters,
  sendTargets,
  type PhoneNotificationFilter,
} from "@/server/services/feed";
import {
  listNotifications,
  notificationActors,
  notificationKey,
  notificationTypes,
  notificationValues,
  unreadNotifications,
} from "@/server/services/notifications";
import { feedWords, initialsOf, shortName, toneOf } from "./data";
import type { NotifRow } from "./notifications";
import { PhoneFil, type FilMe } from "./feed";
import type { SendTarget } from "./sheets";

/** The texts the screens of the Fil need in the browser. */
export async function FilTexts({
  children,
  recruiter = false,
}: {
  children: ReactNode;
  /** The recruiter's Fil and « Nouvelle publication » (Modèle B recruteur, M3). */
  recruiter?: boolean;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(
        messages,
        recruiter ? ["phoneFil", "phone", "phoneRhFil"] : ["phoneFil", "phone"],
      )}
    >
      {children}
    </NextIntlClientProvider>
  );
}

export function meOf(user: { name: string; image: string | null }): FilMe {
  return { name: user.name, initials: initialsOf(user.name), image: user.image };
}

/** The connections a post can be sent to, ready for the sheet « Envoyer à ». */
export async function sendTargetViews(userId: string): Promise<SendTarget[]> {
  const { t } = await feedWords(userId);
  return (await sendTargets(db, userId)).map((target) => ({
    conversationId: target.conversationId,
    name: target.name,
    initials: initialsOf(target.name),
    image: target.image,
    tone: toneOf(target.name, false),
    line:
      target.title && target.company
        ? t("person.line", { title: target.title, company: target.company })
        : (target.title ?? target.company ?? ""),
  }));
}

/**
 * The Fil tab, kept mounted under the pages (brief § 3): its three lists, the bell, Orbi's card
 * and the connections of « Envoyer à » are all read at once, while the logo shows.
 */
export async function FilTab({
  user,
}: {
  user: { id: string; name: string; image: string | null };
}) {
  const now = new Date();
  const words = await feedWords(user.id, now);
  const [pourvous, abonnements, entreprises, unread, fresh, targets] = await Promise.all([
    listFeed(db, user.id, "pourvous", now),
    listFeed(db, user.id, "abonnements", now),
    listFeed(db, user.id, "entreprises", now),
    unreadNotifications(db, user.id),
    freshMatches(db, user.id, now),
    sendTargetViews(user.id),
  ]);
  return (
    <FilTexts>
      <PhoneFil
        me={meOf(user)}
        unread={unread}
        lists={{
          pourvous: pourvous.map(words.post),
          abonnements: abonnements.map(words.post),
          entreprises: entreprises.map(words.post),
        }}
        offersToday={fresh.length}
        targets={targets}
        loadedAt={now.toISOString()}
      />
    </FilTexts>
  );
}

/** The notifications of the bell of the Fil, with their sentence split around the name. */
export async function notificationRows(userId: string, now = new Date()): Promise<NotifRow[]> {
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const tf = await getTranslations("phoneFil.notifs");
  const all = (await listNotifications(db, userId)).filter((item) =>
    (notificationTypes as readonly string[]).includes(item.type),
  );
  // The photo of the person who wrote, liked, asked… (Ephraïm 29/10/2026).
  const actors = await notificationActors(db, userId, all);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const DAY = 86_400_000;
  const filterOf = (type: string): NotifRow["filter"] =>
    (Object.keys(phoneNotificationFilters) as PhoneNotificationFilter[]).find((key) =>
      (phoneNotificationFilters[key] as readonly string[]).includes(type),
    ) ?? null;
  return all.map((item) => {
    const values = notificationValues(item.payload);
    const actor = actors.get(item.id) ?? null;
    // « Sublime Koyi vous a envoyé un message. »: the name first, in bold, beside the photo.
    const text =
      item.type === "newMessage" && values.senderName
        ? `${values.senderName} ${values.jobTitle ? tf("newMessageJob", values) : tf("newMessage")}`
        : d(`notifications.item.${notificationKey(item.type, values)}`, values);
    const candidate = [
      values.name,
      values.company,
      values.org,
      values.senderName,
      values.inviterName,
    ]
      .filter(Boolean)
      .find((name) => text.startsWith(name));
    const who = candidate ? shortName(candidate) : null;
    const spent = now.getTime() - item.createdAt.getTime();
    const ago =
      spent < 60_000
        ? tf("ago.now")
        : spent < 3_600_000
          ? tf("ago.minutes", { count: Math.floor(spent / 60_000) })
          : item.createdAt >= today
            ? tf("ago.hours", { count: Math.floor(spent / 3_600_000) })
            : item.createdAt.getTime() >= today.getTime() - DAY
              ? tf("ago.yesterday")
              : item.createdAt.getTime() >= today.getTime() - 6 * DAY
                ? (() => {
                    const day = format.dateTime(item.createdAt, { weekday: "long" });
                    return day.charAt(0).toUpperCase() + day.slice(1);
                  })()
                : format.dateTime(item.createdAt, { day: "numeric", month: "short" });
    const href = item.href ?? "/app/notifications";
    const org = !actor && Boolean(values.company || values.org) && !values.name;
    return {
      id: item.id,
      href: href.startsWith("/app/fil/") ? `${href}?de=notifs` : href,
      group:
        item.createdAt >= today
          ? "today"
          : item.createdAt.getTime() >= today.getTime() - 6 * DAY
            ? "thisWeek"
            : "earlier",
      filter: filterOf(item.type),
      who,
      what: candidate ? text.slice(candidate.length) : text,
      ago,
      unread: !item.readAt,
      avatar: who
        ? { initials: initialsOf(who), tone: toneOf(who, org), org, image: actor?.image ?? null }
        : null,
    };
  });
}
