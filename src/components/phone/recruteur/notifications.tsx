import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import { dynamic } from "@/i18n/dynamic";
import { EndingOffers } from "@/components/recruiter/ending";
import { JoinRequestsCard } from "@/components/recruiter/org-join";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import {
  listNotifications,
  notificationTypes,
  notificationValues,
} from "@/server/services/notifications";
import { initialsOf, tintOf } from "./candidatures";
import { RhNotifications, type RhNotifRow, type RhNotifTab } from "./notifications-client";

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
  newMessage: "reseau",
  teamMessage: "reseau",
  mention: "reseau",
  contactRequest: "reseau",
  contactAccepted: "reseau",
  contactDeclined: "reseau",
  feedReply: "reseau",
  feedMention: "reseau",
  feedLike: "reseau",
  feedRepost: "reseau",
  feedQuote: "reseau",
};

/** The member's notifications, grouped as on the planches: today, yesterday, this week, earlier. */
export async function rhNotificationRows(userId: string, now = new Date()): Promise<RhNotifRow[]> {
  const t = await getTranslations();
  const d = dynamic(t);
  const ta = await getTranslations("phoneRhNotifs.ago");
  const format = await getFormatter();
  const all = (await listNotifications(db, userId)).filter((item) =>
    (notificationTypes as readonly string[]).includes(item.type),
  );
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const DAY = 86_400_000;
  return all.map((item) => {
    const values = notificationValues(item.payload);
    const text = d(`notifications.item.${item.type}`, values);
    const who = [
      values.name,
      values.candidateName,
      values.senderName,
      values.inviterName,
      values.company,
      values.org,
    ]
      .filter(Boolean)
      .find((name) => text.startsWith(name));
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
      text,
      ago,
      unread: !item.readAt,
      initials: who ? initialsOf(who) : null,
      tint: tintOf(who ?? item.type),
    };
  });
}

/**
 * Notifications of the recruiter on the phone (planches 180 to 183). Above the list, the requests
 * to join the organization (planche 183) and the offers closing soon, answered on the spot.
 */
export async function RhNotificationsScreen({
  ctx,
  query,
}: {
  ctx: HireContext;
  query: Record<string, string | string[] | undefined>;
}) {
  const answer = (key: string) => (typeof query[key] === "string" ? query[key] : undefined);
  return (
    <RhNotifications
      rows={await rhNotificationRows(ctx.userId)}
      top={
        <>
          <JoinRequestsCard ctx={ctx} answer={answer("demande")} />
          <EndingOffers ctx={ctx} answer={answer("fin")} />
        </>
      }
    />
  );
}
