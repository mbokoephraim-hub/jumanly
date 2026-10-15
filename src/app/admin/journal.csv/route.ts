import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { actionLabel, targetLabel } from "@/components/admin/audit";
import { toCsv } from "@/lib/csv";
import { getCurrentUser } from "@/server/auth/session";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { db } from "@/server/db";
import { exportAudit, readAuditFilters } from "@/server/services/admin-audit";

/** « Exporter en CSV » of the journal d'audit (Admin v2, étape 1), with the page's filters. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !(ADMIN_ROLES as readonly string[]).includes(user.platformRole)) {
    return new NextResponse(null, { status: 404 });
  }
  if (user.platformRole === "platform_admin" && !user.twoFactorEnabled) {
    return new NextResponse(null, { status: 404 });
  }
  const filters = readAuditFilters(Object.fromEntries(new URL(request.url).searchParams));
  const entries = await exportAudit(db, filters);
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.audit.export",
      targetType: "platform",
      targetId: "audit",
      metadata: { ...filters, rows: entries.length },
    },
  });
  const t = await getTranslations("admin");
  const csv = toCsv(
    [
      t("journal.col.when"),
      t("journal.col.who"),
      t("journal.col.what"),
      t("journal.csv.action"),
      t("journal.col.target"),
      t("journal.csv.targetId"),
      t("journal.col.reason"),
    ],
    entries.map((entry) => [
      entry.createdAt.toISOString(),
      entry.actor
        ? `${entry.actor.name} <${entry.actor.email}>`
        : t(entry.actorId ? "journal.deletedActor" : "journal.system"),
      actionLabel(t, entry.action),
      entry.action,
      entry.targetLabel ?? targetLabel(t, entry.targetType),
      entry.targetId,
      entry.reason ?? "",
    ]),
  );
  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${t("journal.csv.file")}.csv"`,
    },
  });
}
