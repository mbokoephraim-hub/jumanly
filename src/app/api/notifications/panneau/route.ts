import { NextResponse } from "next/server";
import { notificationGroups } from "@/components/talent/notification-rows";
import { getCurrentUser } from "@/server/auth/session";

/** Rows shown by the panel under the bell (planche web talent-2 § 4). */
const PANEL_SIZE = 8;

/**
 * The panel of notifications under the bell of the web top bar: the latest ones grouped by day,
 * with their title, line, icon and time. Read only: a row marks itself read when it is opened.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { groups, unread } = await notificationGroups(user.id, PANEL_SIZE);
  return NextResponse.json({ groups, unread }, { headers: { "Cache-Control": "no-store" } });
}
