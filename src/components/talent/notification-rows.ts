import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import type { TalentIconName } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { db } from "@/server/db";
import {
  listNotifications,
  notificationTypes,
  notificationValues,
  type NotificationType,
} from "@/server/services/notifications";

/** A short title and a line for what a talent receives (planche talent-2 § 5); the rest keeps its sentence. */
const look: Partial<Record<NotificationType, { icon: TalentIconName; tone: string }>> = {
  interviewInvite: { icon: "entretien", tone: "t-c2" },
  interviewCanceled: { icon: "entretien", tone: "" },
  profileViewed: { icon: "profil", tone: "t-c3" },
  statusChange: { icon: "candidature", tone: "t-c3" },
  notSelected: { icon: "candidature", tone: "" },
  jobUnavailable: { icon: "offre", tone: "" },
  certificateIssued: { icon: "certificat", tone: "t-c1" },
  documentRequest: { icon: "document", tone: "" },
  newMessage: { icon: "message", tone: "t-c2" },
  contactRequest: { icon: "entreprise", tone: "t-c2" },
  diagnosticReady: { icon: "progression", tone: "t-c1" },
};
const accountIcon: Partial<Record<NotificationType, TalentIconName>> = {
  paymentSucceeded: "portefeuille",
  paymentFailed: "portefeuille",
  renewalDue: "portefeuille",
  grace: "portefeuille",
  renewed: "portefeuille",
  upgraded: "portefeuille",
  downgraded: "portefeuille",
  diagnosticReminder: "agenda",
};

const DAY = 86_400_000;

export type NotificationRow = {
  id: string;
  title: string;
  line: string | null;
  icon: TalentIconName;
  tone: string;
  time: string;
  href: string;
  unread: boolean;
};
export type NotificationGroup = {
  key: "today" | "thisWeek" | "earlier";
  title: string;
  items: NotificationRow[];
};

/**
 * The notifications of a talent grouped by day (planche talent-2 § 5): the page
 * `/app/notifications` and the panel under the bell of the web top bar (planche web talent-2 § 4)
 * show the same rows. `take` keeps the panel short.
 */
export async function notificationGroups(userId: string, take?: number) {
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const now = new Date();
  const all = (await listNotifications(db, userId)).filter((item) =>
    (notificationTypes as readonly string[]).includes(item.type),
  );
  const notifications = take ? all.slice(0, take) : all;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const groupOf = (date: Date) =>
    date >= today ? "today" : date.getTime() >= today.getTime() - 6 * DAY ? "thisWeek" : "earlier";
  const timeOf = (date: Date) => {
    const group = groupOf(date);
    if (group === "today") return format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
    if (group === "thisWeek") return format.dateTime(date, { weekday: "short" });
    return format.dateTime(date, { day: "numeric", month: "short" });
  };
  const row = (notification: (typeof all)[number]): NotificationRow => {
    const type = notification.type as NotificationType;
    const values = notificationValues(notification.payload);
    const style = look[type];
    const line = style
      ? type === "interviewInvite"
        ? t("notifs.line.interviewInvite", { company: values.company ?? "" })
        : type === "diagnosticReady"
          ? t("notifs.line.diagnosticReady", { stage: values.stage ?? "" })
          : [
              values.company ?? values.org ?? values.senderName,
              values.jobTitle ?? values.job ?? values.courseTitle ?? values.documentName,
            ]
              .filter(Boolean)
              .join(" · ")
      : null;
    return {
      id: notification.id,
      title: style ? d(`notifs.title.${type}`, values) : d(`notifications.item.${type}`, values),
      line: line || null,
      icon: style?.icon ?? accountIcon[type] ?? "notification",
      tone: style?.tone ?? "",
      time: timeOf(notification.createdAt),
      href: notification.href ?? "",
      unread: !notification.readAt,
    };
  };
  const groups: NotificationGroup[] = (["today", "thisWeek", "earlier"] as const)
    .map((key) => ({
      key,
      title: t(`notifs.group.${key}`),
      items: notifications.filter((item) => groupOf(item.createdAt) === key).map(row),
    }))
    .filter((group) => group.items.length > 0);
  return { groups, unread: all.some((item) => !item.readAt) };
}
