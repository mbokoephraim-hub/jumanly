import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { toCsv } from "@/lib/csv";
import { getCurrentUser } from "@/server/auth/session";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { db } from "@/server/db";
import {
  DASHBOARD_PERIODS,
  dashboardData,
  type DashboardPeriod,
} from "@/server/services/admin-dashboard";

/** « Exporter les indicateurs » (mockup 07-01): the figures of the period, and of the one before. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !(ADMIN_ROLES as readonly string[]).includes(user.platformRole)) {
    return new NextResponse(null, { status: 404 });
  }
  if (user.platformRole === "platform_admin" && !user.twoFactorEnabled) {
    return new NextResponse(null, { status: 404 });
  }
  const asked = new URL(request.url).searchParams.get("periode");
  const days = (DASHBOARD_PERIODS.find((value) => String(value) === asked) ??
    30) as DashboardPeriod;
  const data = await dashboardData(db, new Date(), days);
  const t = await getTranslations("admin.dashboard");
  const usd = (cents: number) => (cents / 100).toFixed(2);
  const pct = (value: number | null) => (value === null ? "" : String(value));
  const rows: [
    (
      | "usersFree"
      | "usersPaid"
      | "usersSponsored"
      | "conversion"
      | "mrr"
      | "renewal"
      | "revenue30"
      | "aiCost"
      | "activeCompanies"
      | "institutionalRevenue"
    ),
    string,
    string,
  ][] = [
    ["usersFree", String(data.current.usersFree), String(data.previous.usersFree)],
    ["usersPaid", String(data.current.usersPaid), String(data.previous.usersPaid)],
    ["usersSponsored", String(data.current.usersSponsored), String(data.previous.usersSponsored)],
    ["conversion", pct(data.revenue.conversion), pct(data.revenueBefore.conversion)],
    ["mrr", usd(data.current.mrrCents), usd(data.previous.mrrCents)],
    ["renewal", pct(data.revenue.renewal), pct(data.revenueBefore.renewal)],
    ["revenue30", usd(data.revenue.revenueCents), usd(data.revenueBefore.revenueCents)],
    [
      "aiCost",
      usd(Math.round(data.revenue.aiCostMicroUsd / 10_000)),
      usd(Math.round(data.revenueBefore.aiCostMicroUsd / 10_000)),
    ],
    [
      "activeCompanies",
      String(data.current.activeCompanies),
      String(data.previous.activeCompanies),
    ],
    ["institutionalRevenue", usd(data.institutionalCents), usd(data.institutionalBeforeCents)],
  ];
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.indicators.export",
      targetType: "platform",
      targetId: "indicators",
      metadata: { days },
    },
  });
  const csv = toCsv(
    [t("csv.indicator"), t("csv.value"), t("csv.previous")],
    rows.map(([key, value, previous]) => [t(`kpi.${key}`), value, previous]),
  );
  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${t("csv.file")}-${days}j.csv"`,
    },
  });
}
