import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { readInterview } from "@/server/services/hire-interviews";
import { interviewCalendar } from "@/server/services/suivi";

/**
 * « Ajouter à mon agenda » for the recruiting team (Modèle B recruteur M5, planche
 * Recruteur-planifie): an interview of the organization, as an .ics file, at its confirmed time or
 * the first time proposed.
 */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/hire/entretiens/[id]/agenda">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const interview = await readInterview(
    db,
    { userId: user.id, organizationId: space.organizationId, role: space.role },
    id,
  ).catch(() => null);
  const startsAt = interview?.startsAt ?? interview?.slots[0] ?? null;
  if (!interview || !startsAt || interview.status === "canceled")
    return new NextResponse(null, { status: 404 });
  const t = await getTranslations("phoneRhCandidatures.calendar");
  const body = interviewCalendar({
    id: interview.id,
    startsAt,
    durationMinutes: interview.durationMinutes,
    summary: t("summary", {
      name: interview.application.profile.user.name,
      job: interview.application.job.title,
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
