import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Alert, StatCard } from "@/components/ui";
import { formatUsd } from "@/lib/money";
import { requireAdmin, requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { revenueIndicators } from "@/server/services/billing-admin";

/** Indicators that exist at this step: accounts by plan status and recurring revenue. */
export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  await connection();
  if (!(await requireAdmin())) {
    // Content editors land on the courses, the only part of the admin they use.
    if (await requireCourseEditor()) redirect("/admin/formations");
    notFound();
  }
  const t = await getTranslations("admin");
  const now = new Date();
  const [users, paid, sponsored, companies, signups] = await Promise.all([
    db.user.count(),
    db.subscription.findMany({
      where: {
        subjectType: "user",
        status: { in: ["active", "trialing", "past_due"] },
        currentPeriodEnd: { gt: now },
      },
      select: { plan: { select: { priceCents: true } } },
    }),
    db.subscription.count({
      where: { subjectType: "user", status: "sponsored", currentPeriodEnd: { gt: now } },
    }),
    db.organization.count({ where: { type: "company" } }),
    db.user.count({ where: { createdAt: { gt: new Date(now.getTime() - 30 * 86_400_000) } } }),
  ]);
  const orgRevenue = await db.subscription.findMany({
    where: {
      subjectType: "organization",
      status: { in: ["active", "past_due"] },
      currentPeriodEnd: { gt: now },
    },
    select: { plan: { select: { priceCents: true } } },
  });
  const mrr = [...paid, ...orgRevenue].reduce((sum, row) => sum + (row.plan.priceCents ?? 0), 0);
  const revenue = await revenueIndicators(db, now);
  const percent = (value: number | null) =>
    value === null ? t("dashboard.kpi.none") : t("dashboard.kpi.value.percent", { value });
  return (
    <>
      <h1 className="text-h1">{t("dashboard.title")}</h1>
      {params.erreur === "lecture" && <Alert tone="warning" title={t("notAllowed")} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("dashboard.kpi.usersFree")}
          value={String(users - paid.length - sponsored)}
        />
        <StatCard label={t("dashboard.kpi.usersPaid")} value={String(paid.length)} />
        <StatCard label={t("dashboard.kpi.usersSponsored")} value={String(sponsored)} />
        <StatCard
          label={t("dashboard.kpi.mrr")}
          value={t("dashboard.kpi.value.currency", { amount: formatUsd(mrr), currency: "USD" })}
        />
        <StatCard label={t("dashboard.kpi.activeCompanies")} value={String(companies)} />
        <StatCard label={t("dashboard.activity.signups")} value={String(signups)} />
        <StatCard
          label={t("dashboard.kpi.revenue30")}
          value={t("dashboard.kpi.value.currency", {
            amount: formatUsd(revenue.revenueCents),
            currency: "USD",
          })}
        />
        <StatCard label={t("dashboard.kpi.conversion")} value={percent(revenue.conversion)} />
        <StatCard label={t("dashboard.kpi.renewal")} value={percent(revenue.renewal)} />
        <StatCard
          label={t("dashboard.kpi.aiCost")}
          value={t("dashboard.kpi.value.currency", {
            amount: formatUsd(Math.round(revenue.aiCostMicroUsd / 10_000)),
            currency: "USD",
          })}
        />
      </div>
      <p className="text-sm text-ardoise">{t("dashboard.kpi.period")}</p>
    </>
  );
}
