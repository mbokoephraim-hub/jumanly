import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon, type IconName } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { TabRail } from "@/components/motion/tab-rail";
import { Alert, EmptyState, segmentedItem, segmentedList } from "@/components/ui";
import { cx } from "@/lib/cx";
import { markNotificationsReadAction } from "@/server/actions/connect";
import { db } from "@/server/db";
import {
  listNotifications,
  notificationTypes,
  notificationValues,
  type NotificationType,
} from "@/server/services/notifications";

type Category = "applications" | "messages" | "learn" | "account";

const categoryOf: Record<NotificationType, Category> = {
  newApplication: "applications",
  statusChange: "applications",
  notSelected: "applications",
  matchReviewed: "applications",
  jobApproved: "applications",
  jobRejected: "applications",
  jobChangesRequested: "applications",
  reportClosed: "account",
  moderationWarning: "account",
  contactRequest: "applications",
  contactAccepted: "applications",
  contactDeclined: "applications",
  interviewInvite: "applications",
  interviewTeam: "applications",
  interviewConfirmed: "applications",
  interviewReschedule: "applications",
  interviewDeclined: "applications",
  interviewCanceled: "applications",
  interviewAccepted: "applications",
  newMessage: "messages",
  feedReply: "messages",
  feedMention: "messages",
  feedLike: "messages",
  feedRepost: "messages",
  feedQuote: "messages",
  documentRequest: "messages",
  mention: "messages",
  certificateIssued: "learn",
  orgInvite: "account",
  paymentSucceeded: "account",
  paymentFailed: "account",
  renewalDue: "account",
  grace: "account",
  downgraded: "account",
  upgraded: "account",
  renewed: "account",
  orgVerified: "account",
  orgVerificationRejected: "account",
  orgVerificationInfo: "account",
  orgSuspended: "account",
  orgReactivated: "account",
  orgDeleted: "account",
  jobUnavailable: "applications",
  abnormalUsage: "account",
  licenseActivated: "account",
  licenseOnHold: "account",
  licenseExpiring: "account",
  licenseExpired: "account",
  licensesLow: "account",
  diagnosticReady: "learn",
  diagnosticReminder: "learn",
  profileViewed: "applications",
  atsReady: "applications",
  atsNotRun: "applications",
  orgJoinRequest: "account",
  orgJoinAccepted: "account",
  orgJoinDeclined: "account",
  jobEnding: "applications",
  candidateAssigned: "applications",
  talentShared: "applications",
  teamMessage: "messages",
  colleagueProposed: "account",
  planRequested: "account",
  orgTaskAssigned: "applications",
  orgTaskReminder: "applications",
  orgTaskDone: "applications",
};

const categoryStyle: Record<Category, { icon: IconName; tile: string }> = {
  applications: { icon: "jobs", tile: "bg-lime-clair" },
  messages: { icon: "message", tile: "bg-menthe-claire" },
  learn: { icon: "certificat", tile: "bg-neon" },
  account: { icon: "securite", tile: "bg-brume" },
};

const typeIcon: Partial<Record<NotificationType, IconName>> = {
  interviewInvite: "calendrier",
  documentRequest: "doc",
  paymentSucceeded: "portefeuille",
  paymentFailed: "portefeuille",
  statusChange: "check",
  diagnosticReady: "intelligence",
  diagnosticReminder: "calendrier",
};

/** Types that ask for an answer: unread, they open the list under « Important » (screen 19). */
const important = new Set<NotificationType>([
  "interviewInvite",
  "interviewTeam",
  "interviewConfirmed",
  "interviewReschedule",
  "interviewDeclined",
  "interviewCanceled",
  "newMessage",
  "documentRequest",
  "mention",
  "statusChange",
  "notSelected",
  "newApplication",
  "contactRequest",
  "contactAccepted",
  "contactDeclined",
  "jobRejected",
  "jobChangesRequested",
  "moderationWarning",
  "paymentFailed",
  "renewalDue",
  "grace",
  "downgraded",
  "orgSuspended",
  "orgDeleted",
  "licenseExpiring",
  "licenseExpired",
  "abnormalUsage",
]);

const tabIds = ["toutes", "non-lues", "candidatures", "messages", "formations", "compte"] as const;
type Tab = (typeof tabIds)[number];
const tabCategory: Partial<Record<Tab, Category>> = {
  candidatures: "applications",
  messages: "messages",
  formations: "learn",
  compte: "account",
};

const DAY = 86_400_000;

/**
 * Notifications of a recruiting team or a partner (textes `notifications.*`, mockup 03-22): grouped
 * by day, filtered by kind; each line opens its page and is marked read. The talent has its own
 * screen (planche talent-2 § 5).
 */
export async function TeamNotifications({
  params,
  user,
}: {
  params: Record<string, string | string[] | undefined>;
  user: { id: string };
}) {
  const t = await getTranslations("notifications");
  const format = await getFormatter();
  const now = new Date();
  const tab: Tab = tabIds.includes(params.onglet as Tab) ? (params.onglet as Tab) : "toutes";
  const all = (await listNotifications(db, user.id)).filter((item) =>
    (notificationTypes as readonly string[]).includes(item.type),
  );
  const unreadCount = all.filter((item) => !item.readAt).length;
  const notifications = all.filter((item) =>
    tab === "non-lues"
      ? !item.readAt
      : tabCategory[tab]
        ? categoryOf[item.type as NotificationType] === tabCategory[tab]
        : true,
  );
  const tabs: { id: Tab; label: string }[] = [
    { id: "toutes", label: t("tab.all") },
    {
      id: "non-lues",
      label: unreadCount > 0 ? t("tab.unreadCount", { count: unreadCount }) : t("tab.unread"),
    },
    { id: "candidatures", label: t("tab.applications") },
    { id: "messages", label: t("tab.messages") },
    { id: "formations", label: t("tab.learn") },
    { id: "compte", label: t("tab.account") },
  ];

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const groupOf = (date: Date) =>
    date >= startOfToday
      ? "today"
      : date.getTime() >= startOfToday.getTime() - DAY
        ? "yesterday"
        : date.getTime() >= startOfToday.getTime() - 6 * DAY
          ? "thisWeek"
          : "earlier";
  // « Toutes » is sorted by priority (screen 19): what asks for an answer, then what is for the
  // person, then Jumanly's own news. The other tabs keep the days.
  const priorityOf = (item: (typeof notifications)[number]) => {
    const type = item.type as NotificationType;
    if (!item.readAt && important.has(type)) return "important";
    return categoryOf[type] === "account" ? "jumanly" : "forYou";
  };
  const groups =
    tab === "toutes"
      ? (["important", "forYou", "jumanly"] as const)
          .map((key) => ({
            key,
            title: t(`priority.${key}`),
            items: notifications.filter((item) => priorityOf(item) === key),
          }))
          .filter((group) => group.items.length > 0)
      : (["today", "yesterday", "thisWeek", "earlier"] as const)
          .map((key) => ({
            key,
            title: t(`group.${key}`),
            items: notifications.filter((item) => groupOf(item.createdAt) === key),
          }))
          .filter((group) => group.items.length > 0);
  const timeOf = (date: Date) => {
    const group = groupOf(date);
    const time = format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
    if (group === "today") return time;
    if (group === "yesterday") return t("time.yesterday", { time });
    if (group === "thisWeek") {
      const day = format.dateTime(date, { weekday: "long" });
      return day.charAt(0).toUpperCase() + day.slice(1);
    }
    return format.dateTime(date, { dateStyle: "medium" });
  };

  const markAll = unreadCount > 0 && (
    <form action={markNotificationsReadAction}>
      <button type="submit" className={pillClass("outline", "sm")}>
        <Icon name="check" className="size-4" />
        {t("markAllRead")}
      </button>
    </form>
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <AppPageHeader title={t("title")} actions={markAll || undefined} />
      {params.ok === "lues" && <Alert tone="success" title={t("allRead")} />}
      <div className="flex flex-wrap items-center justify-between gap-3 max-md:hidden">
        <nav aria-label={t("tabs")} className="max-w-full min-w-0">
          <TabRail name="notifications-tabs" className="bg-transparent! p-0!">
            <div className={segmentedList}>
              {tabs.map((item) => {
                const active = item.id === tab;
                return (
                  <Link
                    key={item.id}
                    href={
                      item.id === "toutes"
                        ? "/app/notifications"
                        : `/app/notifications?onglet=${item.id}`
                    }
                    aria-current={active ? "page" : undefined}
                    className={segmentedItem(active)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </TabRail>
        </nav>
        <Link
          href="/app/parametres?onglet=confidentialite"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-feuille-fonce hover:underline max-lg:hidden"
        >
          <Icon name="reglages" className="size-4" />
          {t("settings")}
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState title={tab === "non-lues" ? t("empty.unread") : t("empty.text")} />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`notifications-${group.key}`}
              className="flex flex-col gap-2"
            >
              <h2
                id={`notifications-${group.key}`}
                className="px-1 text-[11px] font-semibold tracking-[0.09em] text-ardoise uppercase"
              >
                {group.title}
              </h2>
              <ul
                className={cx(
                  "flex flex-col overflow-hidden rounded-[24px] bg-blanc shadow-douce",
                  group.key === "important" &&
                    "bg-linear-to-br from-lime-clair/70 via-blanc to-blanc",
                )}
              >
                {group.items.map((notification, index) => {
                  const type = notification.type as NotificationType;
                  const style = categoryStyle[categoryOf[type]];
                  const unread = !notification.readAt;
                  return (
                    <li key={notification.id} className={cx(index > 0 && "border-t border-brume")}>
                      <form action={markNotificationsReadAction}>
                        <input type="hidden" name="id" value={notification.id} />
                        <input type="hidden" name="href" value={notification.href ?? ""} />
                        <button
                          type="submit"
                          className={cx(
                            "relative flex w-full items-center gap-3.5 py-4 pr-4 pl-5 text-left hover:bg-creme/60 focus-visible:bg-creme lg:pr-5",
                          )}
                        >
                          {unread && (
                            <span className="absolute top-1/2 left-2 size-2 -translate-y-1/2 rounded-full bg-feuille">
                              <span className="sr-only">{t("item.unread")}</span>
                            </span>
                          )}
                          <span
                            aria-hidden
                            className={cx(
                              "flex size-12 shrink-0 items-center justify-center rounded-[16px] text-sapin",
                              unread ? style.tile : "bg-creme",
                            )}
                          >
                            <Icon name={typeIcon[type] ?? style.icon} className="size-5" />
                          </span>
                          <span
                            className={cx(
                              "min-w-0 flex-1 text-[15px] leading-[21px] text-sapin",
                              unread && "font-semibold",
                            )}
                          >
                            {t(`item.${type}`, notificationValues(notification.payload))}
                          </span>
                          <span className="shrink-0 self-start text-[13px] text-ardoise">
                            {timeOf(notification.createdAt)}
                          </span>
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      <Link
        href="/app/parametres?onglet=confidentialite"
        className="flex items-center justify-center gap-2 py-2 text-[15px] font-semibold text-feuille-fonce hover:underline md:hidden"
      >
        <Icon name="filtre" className="size-[18px]" />
        {t("preferences")}
      </Link>
    </div>
  );
}
