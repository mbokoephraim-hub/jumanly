import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import { PushPrompt } from "../push-prompt";
import { pushLabels } from "../push-prompt-texts";
import { dynamic } from "@/i18n/dynamic";
import { EndingOffers } from "@/components/recruiter/ending";
import { JoinRequestsCard } from "@/components/recruiter/org-join";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import {
  listNotifications,
  notificationActors,
  notificationKey,
  notificationTypes,
  notificationValues,
} from "@/server/services/notifications";
import { notifModelOf } from "../notif-model";
import { initialsOf, tintOf } from "./candidatures";
import { PhoneNotifications, type NotifRow } from "../fil/notifications";
import type { NotifModelView } from "../notif-badge";

type RhNotifTab = "candidatures" | "entretiens" | "reseau";
type RhNotifRow = {
  id: string;
  href: string;
  group: "today" | "yesterday" | "thisWeek" | "earlier";
  tab: RhNotifTab | null;
  /** The name that opens the sentence, written in bold. */
  who: string | null;
  text: string;
  ago: string;
  unread: boolean;
  initials: string | null;
  image: string | null;
  tint: string;
  model: NotifModelView;
};

/** The tab of each type (planches 180 to 183): what is not listed only shows under « Tout ». */
const TAB_OF: Partial<Record<string, RhNotifTab>> = {
  newApplication: "candidatures",
  statusChange: "candidatures",
  notSelected: "candidatures",
  matchReviewed: "candidatures",
  documentRequest: "candidatures",
  jobApproved: "candidatures",
  jobRejected: "candidatures",
  jobChangesRequested: "candidatures",
  interviewInvite: "entretiens",
  interviewTeam: "entretiens",
  interviewConfirmed: "entretiens",
  interviewReschedule: "entretiens",
  interviewDeclined: "entretiens",
  interviewCanceled: "entretiens",
  interviewAccepted: "entretiens",
  interviewSoon: "entretiens",
  reviewReminder: "candidatures",
  verificationCheck: "candidatures",
  jobOpened: "candidatures",
  jobOpenFailed: "candidatures",
  newMessage: "reseau",
  teamMessage: "reseau",
  colleagueProposed: "reseau",
  planRequested: "reseau",
  mention: "reseau",
  contactRequest: "reseau",
  contactAccepted: "reseau",
  contactDeclined: "reseau",
  feedReply: "reseau",
  feedMention: "reseau",
  feedLike: "reseau",
  feedRepost: "reseau",
  feedQuote: "reseau",
  connectionRequest: "reseau",
  connectionAccepted: "reseau",
};

/** The member's notifications, grouped as on the planches: today, yesterday, this week, earlier. */
export async function rhNotificationRows(userId: string, now = new Date()): Promise<RhNotifRow[]> {
  const t = await getTranslations();
  const d = dynamic(t);
  const ta = await getTranslations("phoneRhNotifs.ago");
  const tf = await getTranslations("phoneFil.notifs");
  const tm = await getTranslations("notifModels");
  const format = await getFormatter();
  const all = (await listNotifications(db, userId)).filter((item) =>
    (notificationTypes as readonly string[]).includes(item.type),
  );
  // The photo of the person who wrote, asked, shared… (Ephraïm 29/10/2026).
  const actors = await notificationActors(db, userId, all);
  const modelOf = await notifModelOf();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const DAY = 86_400_000;
  return all.map((item) => {
    const values = notificationValues(item.payload);
    // « Amani Démo vous a envoyé un message. »: the name first, beside the photo (03/11/2026).
    const text =
      item.type === "newMessage" && values.senderName
        ? `${values.senderName} ${values.jobTitle ? tf("newMessageJob", values) : tf("newMessage")}`
        : item.type === "newApplication" && values.candidateName
          ? `${values.candidateName} ${tm("text.newApplication", values)}`
          : d(`notifications.item.${notificationKey(item.type, values)}`, values);
    const actor = actors.get(item.id) ?? null;
    const named = [
      values.name,
      values.candidateName,
      values.senderName,
      values.inviterName,
      values.company,
      values.org,
    ]
      .filter(Boolean)
      .find((name) => text.startsWith(name));
    const who = named ?? actor?.name ?? null;
    const spent = now.getTime() - item.createdAt.getTime();
    const at = item.createdAt.getTime();
    const group: RhNotifRow["group"] =
      at >= today.getTime()
        ? "today"
        : at >= today.getTime() - DAY
          ? "yesterday"
          : at >= today.getTime() - 6 * DAY
            ? "thisWeek"
            : "earlier";
    const ago =
      spent < 60_000
        ? ta("now")
        : spent < 3_600_000
          ? ta("minutes", { count: Math.floor(spent / 60_000) })
          : group === "today"
            ? ta("hours", { count: Math.floor(spent / 3_600_000) })
            : group === "yesterday"
              ? ta("yesterday")
              : group === "thisWeek"
                ? format.dateTime(item.createdAt, { weekday: "long" })
                : format.dateTime(item.createdAt, { day: "numeric", month: "short" });
    return {
      id: item.id,
      href: item.href ?? "/app/notifications",
      group,
      tab: TAB_OF[item.type] ?? null,
      // The name in bold, the rest of the sentence in normal weight.
      who: named ?? null,
      text: named ? text.slice(named.length) : text,
      ago,
      unread: !item.readAt,
      initials: who ? initialsOf(who) : null,
      image: actor?.image ?? null,
      tint: tintOf(who ?? item.type),
      model: modelOf(item.type),
    };
  });
}

/**
 * Notifications of the recruiter on the phone, on the talent's design (Ephraïm 03/11/2026: « le
 * même design que celui du talent, sauf que les notifications seront différentes »): the chips
 * « Tout · Candidatures · Entretiens · Réseau », and above the list the requests to join the
 * organization and the offers closing soon, answered on the spot.
 */
export async function RhNotificationsScreen({
  ctx,
  query,
}: {
  ctx: HireContext;
  query: Record<string, string | string[] | undefined>;
}) {
  const answer = (key: string) => (typeof query[key] === "string" ? query[key] : undefined);
  const t = await getTranslations("phoneRhNotifs");
  const rows = (await rhNotificationRows(ctx.userId)).map((row): NotifRow => ({
    id: row.id,
    href: row.href,
    group: row.group === "today" ? "today" : row.group === "earlier" ? "earlier" : "thisWeek",
    filter: row.tab,
    who: row.who,
    what: row.text,
    ago: row.ago,
    unread: row.unread,
    model: row.model,
    avatar:
      row.initials || row.image
        ? {
            initials: row.initials ?? "",
            tone: Number(row.tint),
            org: false,
            image: row.image,
          }
        : null,
  }));
  return (
    <PhoneNotifications
      rows={rows}
      fallback="/app/hire"
      settingsHref="/app/parametres/notifications"
      filters={(["tout", "candidatures", "entretiens", "reseau"] as const).map((key) => ({
        key,
        label: t(`tabs.${key}`),
      }))}
      push={<PushPrompt labels={await pushLabels()} />}
      top={
        <>
          <JoinRequestsCard ctx={ctx} answer={answer("demande")} />
          <EndingOffers ctx={ctx} answer={answer("fin")} />
        </>
      }
    />
  );
}
