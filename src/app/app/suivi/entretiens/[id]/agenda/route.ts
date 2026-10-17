import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { interviewCalendar, talentInterview } from "@/server/services/suivi";

/** « Ajouter à mon agenda » (screen 22): a confirmed interview of the talent, as an .ics file. */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/suivi/entretiens/[id]/agenda">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const interview = await talentInterview(db, user.id, id);
  if (!interview || interview.status !== "confirmed" || !interview.startsAt)
    return new NextResponse(null, { status: 404 });
  const t = await getTranslations("talent.suivi.calendar");
  const body = interviewCalendar({
    id: interview.id,
    startsAt: interview.startsAt,
    durationMinutes: interview.durationMinutes,
    summary: t("summary", {
      job: interview.application.job.title,
      company: interview.organization.name,
    }),
    description: interview.message ?? "",
    location: interview.link ?? interview.address ?? "",
  });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="entretien-jumanly.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
