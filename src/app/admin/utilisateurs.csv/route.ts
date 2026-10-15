import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { toCsv } from "@/lib/csv";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import {
  EXPORT_MAX,
  readUserFilters,
  userListWhere,
  userState,
} from "@/server/services/admin-users";

/**
 * « Exporter en CSV » of /admin/utilisateurs (Admin v2, étape 3): the accounts ticked in the list
 * (`id`, repeated), or the whole filtered list. Administrators only, audited.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.platformRole !== "platform_admin" || !user.twoFactorEnabled) {
    return new NextResponse(null, { status: 404 });
  }
  const params = new URL(request.url).searchParams;
  const ids = params
    .getAll("id")
    .filter((id) => id.length > 0 && id.length <= 60)
    .slice(0, EXPORT_MAX);
  const filters = readUserFilters(Object.fromEntries(params));
  const where = ids.length ? { id: { in: ids } } : await userListWhere(db, filters);
  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: EXPORT_MAX,
    include: {
      talentProfile: { select: { id: true } },
      memberships: { where: { status: "active" }, select: { role: true } },
      sessions: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
    },
  });
  const plans = await Promise.all(
    users.map((row) => resolvePlan(db, { type: "user", id: row.id })),
  );
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.export.list",
      targetType: "platform",
      targetId: "users",
      metadata: { selected: ids.length, rows: users.length, ...(ids.length ? {} : filters) },
    },
  });
  const t = await getTranslations("admin");
  const csv = toCsv(
    [
      t("users.csv.id"),
      t("users.col.name"),
      t("users.col.email"),
      t("users.col.plan"),
      t("users.col.status"),
      t("users.csv.emailVerified"),
      t("users.csv.twoFactor"),
      t("users.col.roles"),
      t("users.col.created"),
      t("users.col.lastActive"),
    ],
    users.map((row, index) => [
      row.id,
      row.name,
      row.email,
      plans[index]?.planName ?? "",
      t(`users.status.${userState(row)}`),
      t(row.emailVerified ? "users.csv.yes" : "users.csv.no"),
      t(row.twoFactorEnabled ? "users.csv.yes" : "users.csv.no"),
      [
        ...(row.platformRole === "user" ? [] : [t(`platformRole.${row.platformRole}`)]),
        ...(row.talentProfile ? [t("memberRole.talent")] : []),
        ...[...new Set(row.memberships.map((membership) => membership.role))].map((role) =>
          t(`memberRole.${role}`),
        ),
      ].join(", "),
      row.createdAt.toISOString(),
      row.sessions[0]?.updatedAt.toISOString() ?? "",
    ]),
  );
  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${t("users.csv.file")}.csv"`,
    },
  });
}
