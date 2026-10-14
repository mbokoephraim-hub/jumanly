import { NextResponse } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  importantNotificationTypes,
  latestNotifications,
  notificationValues,
  unreadNotifications,
  type NotificationType,
} from "@/server/services/notifications";

/**
 * Notifications of the bell (brief § 4.3): the unread count and the latest ones, with their text.
 * The bell asks again every minute while the tab is visible; read only, nothing is marked read.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [unread, latest, t, format] = await Promise.all([
    unreadNotifications(db, user.id),
    latestNotifications(db, user.id),
    getTranslations("notifications"),
    getFormatter(),
  ]);
  const now = new Date();
  return NextResponse.json(
    {
      unread,
      items: latest.map((item) => ({
        id: item.id,
        text: t(`item.${item.type as NotificationType}`, notificationValues(item.payload)),
        href: item.href,
        when: format.relativeTime(item.createdAt, now),
        createdAt: item.createdAt.toISOString(),
        unread: !item.readAt,
        important: importantNotificationTypes.includes(item.type as NotificationType),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
