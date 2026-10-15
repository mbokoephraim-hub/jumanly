import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon, type IconName } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { TabRail } from "@/components/motion/tab-rail";
import { Alert, EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
import { markNotificationsReadAction } from "@/server/actions/connect";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  listNotifications,
  notificationTypes,
  notificationValues,
  type NotificationType,
} from "@/server/services/notifications";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: t("title"), robots: { index: false } };
}

type Category = "applications" | "messages" | "learn" | "account";

const categoryOf: Record<NotificationType, Category> = {
  newApplication: "applications",
  statusChange: "applications",
  notSelected: "applications",
  matchReviewed: "applications",
  jobApproved: "applications",
  jobRejected: "applications",
  contactRequest: "applications",
  contactAccepted: "applications",
  contactDeclined: "applications",
  interviewInvite: "applications",
  interviewTeam: "applications",
  interviewConfirmed: "applications",
  interviewReschedule: "applications",
  interviewDeclined: "applications",
  interviewCanceled: "applications",
  newMessage: "messages",
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
  jobUnavailable: "applications",
  abnormalUsage: "account",
  licenseActivated: "account",
  licenseOnHold: "account",
  licenseExpiring: "account",
  licenseExpired: "account",
  licensesLow: "account",
  diagnosticReady: "learn",
  diagnosticReminder: "learn",
};

const categoryStyle: Record<Category, { icon: IconName; tile: string }> = {
  applications: { icon: "jobs", tile: "bg-lime-clair" },
  messages: { icon: "message", tile: "bg-menthe-clair" },
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

const actions = [
  "interviewInvite",
  "newMessage",
  "documentRequest",
  "certificateIssued",
  "contactRequest",
] as const;

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
 * Notifications (textes `notifications.*`, mockup 03-22): grouped by day, filtered by kind; each
 * line opens its page and is marked read.
 */
export default async function NotificationsPage({ searchParams }: PageProps<"/app/notifications">) {
  const params = await searchParams;
  const user = await requireUser("/app/notifications");
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
  const groups = (["today", "yesterday", "thisWeek", "earlier"] as const)
    .map((key) => ({ key, items: notifications.filter((item) => groupOf(item.createdAt) === key) }))
    .filter((group) => group.items.length > 0);
  const timeOf = (date: Date, group: string) => {
    const time = format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
    if (group === "today") return format.relativeTime(date, now);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={t("tabs")} className="max-w-full min-w-0">
          <TabRail name="notifications-tabs">
            <div className="flex w-max gap-1.5">
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
                    className={cx(
                      "inline-flex h-[34px] shrink-0 items-center rounded-pill px-3.5 text-[12.5px] font-medium whitespace-nowrap",
                      active
                        ? "bg-sapin text-blanc"
                        : "bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset hover:bg-lime-clair",
                    )}
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
                {t(`group.${group.key}`)}
              </h2>
              <ul className="flex flex-col overflow-hidden rounded-[24px] bg-blanc">
                {group.items.map((notification, index) => {
                  const type = notification.type as NotificationType;
                  const style = categoryStyle[categoryOf[type]];
                  const unread = !notification.readAt;
                  const action = (actions as readonly string[]).includes(type)
                    ? t(`action.${type as (typeof actions)[number]}`)
                    : null;
                  return (
                    <li key={notification.id} className={cx(index > 0 && "border-t border-brume")}>
                      <form action={markNotificationsReadAction}>
                        <input type="hidden" name="id" value={notification.id} />
                        <input type="hidden" name="href" value={notification.href ?? ""} />
                        <button
                          type="submit"
                          className={cx(
                            "flex w-full items-start gap-3.5 px-4 py-4 text-left hover:bg-creme focus-visible:bg-creme lg:px-5",
                            unread && "bg-lime-clair/40",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cx(
                              "flex size-10 shrink-0 items-center justify-center rounded-xl text-sapin",
                              style.tile,
                            )}
                          >
                            <Icon name={typeIcon[type] ?? style.icon} className="size-[18px]" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span
                              className={cx(
                                "text-[13.5px] leading-5 text-sapin",
                                unread && "font-semibold",
                              )}
                            >
                              {t(`item.${type}`, notificationValues(notification.payload))}
                            </span>
                            <span className="text-xs text-ardoise">
                              {timeOf(notification.createdAt, group.key)}
                            </span>
                            {action && (
                              <span className={pillClass("dark", "sm", "mt-1 h-8 self-start")}>
                                {action}
                              </span>
                            )}
                          </span>
                          {unread ? (
                            <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-feuille">
                              <span className="sr-only">{t("item.unread")}</span>
                            </span>
                          ) : (
                            <Icon name="chev-r" className="mt-1 size-4 shrink-0 text-ardoise" />
                          )}
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
        className={pillClass("outline", "md", "lg:hidden")}
      >
        <Icon name="reglages" className="size-4" />
        {t("settings")}
      </Link>
    </div>
  );
}
