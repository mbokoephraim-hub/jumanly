import { NextResponse } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { toCsv } from "@/lib/csv";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { describeEvent } from "@/server/hire-history";
import { getOrgApplication, hirePermissions } from "@/server/services/hire";

/** « Exporter l'historique » (`hire.decision_history`): the events of one application, as CSV. */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/hire/candidats/[applicationId]/historique">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space || !hirePermissions(space.role).readApplications)
    return new NextResponse(null, { status: 404 });
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  if (!(await can(db, { type: "organization", id: ctx.organizationId }, "hire.decision_history")))
    return new NextResponse(null, { status: 403 });
  const { applicationId } = await params;
  const application = await getOrgApplication(db, ctx, applicationId).catch(() => null);
  if (!application) return new NextResponse(null, { status: 404 });
  const ids = [
    ...new Set(application.events.flatMap((event) => (event.actorId ? [event.actorId] : []))),
  ];
  const actors = new Map(
    (await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map(
      (actor) => [actor.id, actor.name],
    ),
  );
  const t = await getTranslations("hire");
  const format = await getFormatter();
  const rows = application.events.flatMap((event) => {
    const line = describeEvent(t, event.actorId ? (actors.get(event.actorId) ?? "") : "", event);
    return line
      ? [[format.dateTime(event.createdAt, { dateStyle: "short", timeStyle: "short" }), line]]
      : [];
  });
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "history.export",
      targetType: "application",
      targetId: application.id,
      organizationId: ctx.organizationId,
    },
  });
  const csv = toCsv([t("history.col.date"), t("history.col.event")], rows);
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="historique-candidature.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
