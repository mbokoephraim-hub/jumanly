import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ConnectError } from "@/server/services/connect";
import { visibleMessage } from "@/server/services/messages-phone";
import { interviewCalendar } from "@/server/services/suivi";

/** « Ajouter à l’agenda » on a proposed meeting of a conversation (lot B8): an .ics file. */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/messages/[id]/agenda/[messageId]">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id, messageId } = await params;
  try {
    const message = await visibleMessage(db, user.id, id, messageId);
    const payload = (message.payload ?? {}) as { startsAt?: string; note?: string };
    const startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
    if (message.kind !== "slot" || !startsAt || Number.isNaN(startsAt.getTime()))
      return new NextResponse(null, { status: 404 });
    const t = await getTranslations("phoneMsg.agenda");
    const body = interviewCalendar({
      id: message.id,
      startsAt,
      durationMinutes: 30,
      summary: t("summary"),
      description: payload.note ?? "",
      location: "",
    });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rendez-vous-jumanly.ics"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ConnectError) return new NextResponse(null, { status: 404 });
    throw error;
  }
}
