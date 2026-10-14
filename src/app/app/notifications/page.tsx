import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Alert, Badge, Button, EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
import { markNotificationsReadAction } from "@/server/actions/connect";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  listNotifications,
  notificationTypes,
  type NotificationType,
} from "@/server/services/notifications";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const values = (payload: unknown) =>
  Object.fromEntries(
    Object.entries(payload && typeof payload === "object" ? payload : {}).map(([key, value]) => [
      key,
      String(value ?? ""),
    ]),
  );

/** Notifications (textes `notifications.*`): each line opens its page and is marked read. */
export default async function NotificationsPage({ searchParams }: PageProps<"/app/notifications">) {
  const params = await searchParams;
  const user = await requireUser("/app/notifications");
  const t = await getTranslations("notifications");
  const format = await getFormatter();
  const onlyUnread = params.onglet === "non-lues";
  const notifications = (await listNotifications(db, user.id, onlyUnread)).filter((item) =>
    (notificationTypes as readonly string[]).includes(item.type),
  );
  const unread = notifications.some((item) => !item.readAt);
  const tabs = [
    { id: "toutes", label: t("tab.all") },
    { id: "non-lues", label: t("tab.unread") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader
        title={t("title")}
        actions={
          unread && (
            <form action={markNotificationsReadAction}>
              <Button type="submit" variant="tertiary" size="sm">
                {t("markAllRead")}
              </Button>
            </form>
          )
        }
      />
      {params.ok === "lues" && <Alert tone="success" title={t("allRead")} />}
      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        {tabs.map((item) => {
          const active = (item.id === "non-lues") === onlyUnread;
          return (
            <Link
              key={item.id}
              href={`/app/notifications?onglet=${item.id}`}
              aria-current={active ? "page" : undefined}
              className={cx(
                "rounded-pill px-4 py-2 text-[15px] font-medium",
                active ? "bg-sapin text-blanc" : "bg-blanc",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {notifications.length === 0 ? (
        <EmptyState title={onlyUnread ? t("empty.unread") : t("empty.text")} />
      ) : (
        <ul className="flex flex-col divide-y divide-brume rounded-card bg-blanc">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <form action={markNotificationsReadAction}>
                <input type="hidden" name="id" value={notification.id} />
                <input type="hidden" name="href" value={notification.href ?? ""} />
                <button
                  type="submit"
                  className="flex w-full flex-col gap-1 p-4 text-left hover:bg-creme focus-visible:bg-creme"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cx("text-sapin", !notification.readAt && "font-semibold")}>
                      {t(
                        `item.${notification.type as NotificationType}`,
                        values(notification.payload),
                      )}
                    </span>
                    {!notification.readAt && <Badge tone="new">{t("item.unread")}</Badge>}
                  </span>
                  <span className="text-ardoise text-caption">
                    {format.relativeTime(notification.createdAt, new Date())}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
