import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { toCsv } from "@/lib/csv";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";

/** « Exporter en CSV » of /admin/liste-attente. Administrators only, audited. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.platformRole !== "platform_admin" || !user.twoFactorEnabled) {
    return new NextResponse(null, { status: 404 });
  }
  const entries = await db.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "waitlist.export",
      targetType: "platform",
      targetId: "waitlist",
      metadata: { rows: entries.length },
    },
  });
  const t = await getTranslations();
  const csv = toCsv(
    [
      t("admin.waitlist.col.firstName"),
      t("admin.waitlist.col.lastName"),
      t("admin.waitlist.col.email"),
      t("admin.waitlist.col.profile"),
      t("admin.waitlist.col.country"),
      t("admin.waitlist.col.city"),
      t("admin.waitlist.col.organization"),
      t("admin.waitlist.col.language"),
      t("admin.waitlist.col.date"),
      t("admin.waitlist.col.mail"),
    ],
    entries.map((entry) => [
      entry.firstName,
      entry.lastName ?? "",
      entry.email,
      t(`waitlist.form.profile.${entry.profile}.label`),
      entry.country,
      entry.city ?? "",
      entry.organization ?? "",
      entry.locale,
      entry.createdAt.toISOString(),
      entry.emailSentAt?.toISOString() ?? "",
    ]),
  );
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="liste-attente.csv"',
      "cache-control": "no-store",
    },
  });
}
