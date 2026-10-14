import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Alert, ButtonLink, EmptyState, StatCard, Table, Td, Th } from "@/components/ui";
import { db } from "@/server/db";
import { requirePartner } from "@/server/partner-context";
import { partnerDashboard, type Cell } from "@/server/services/partners";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partner.dashboard");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Partner dashboard (partie 07 § 5): licence counts and aggregated usage, never a person. */
export default async function PartnerDashboardPage() {
  const { ctx, organization } = await requirePartner("/app/partenaire");
  const t = await getTranslations();
  const data = await partnerDashboard(db, ctx);
  const show = (value: Cell) =>
    value.hidden ? t("partner.hidden") : new Intl.NumberFormat("fr").format(value.value ?? 0);
  const month = new Intl.DateTimeFormat("fr", { month: "long", year: "numeric", timeZone: "UTC" });
  const usage = [
    ["learningHours", data.usage.learning.learningHours],
    ["coursesCompleted", data.usage.learning.coursesCompleted],
    ["certificates", data.usage.learning.certificates],
    ["cvCreated", data.usage.career.cvs],
    ["applications", data.usage.employment.applications],
    ["interviewSims", data.usage.career.interviewSims],
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <AppPageHeader
        eyebrow={t("partner.dashboard.eyebrow", { org: organization.name })}
        title={t("partner.dashboard.title")}
        subtitle={t("partner.dashboard.subtitle")}
      />
      <Alert tone="info" title={t("partner.dashboard.privacy")} />

      {data.batches.length === 0 ? (
        <EmptyState title={t("partner.dashboard.empty")} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("partner.dashboard.kpi.purchased")}
              value={String(data.totals.purchased)}
              hint={t("partner.dashboard.kpi.available", { count: data.totals.available })}
            />
            <StatCard
              label={t("partner.dashboard.kpi.distributed")}
              value={String(data.totals.distributed)}
            />
            <StatCard
              label={t("partner.dashboard.kpi.activated")}
              value={String(data.totals.activated)}
              hint={t("partner.dashboard.kpi.activationRate", { percent: data.activationRate })}
            />
            <StatCard
              label={t("partner.dashboard.kpi.active")}
              value={show(data.active30)}
              hint={
                data.active30.hidden
                  ? t("partner.dashboard.smallGroup", { minGroup: data.minGroup })
                  : undefined
              }
            />
          </section>

          <section aria-labelledby="usage" className="flex flex-col gap-3">
            <h2 id="usage" className="text-h2">
              {t("partner.dashboard.usage.title")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {usage.map(([key, value]) => (
                <StatCard
                  key={key}
                  label={t(`partner.dashboard.usage.${key}`)}
                  value={show(value)}
                />
              ))}
              <StatCard
                label={t("partner.dashboard.usage.hiresDeclared.text")}
                value={show(data.usage.employment.hiresDeclared)}
                hint={t("partner.dashboard.usage.hiresDeclared.hint")}
              />
            </div>
            <p className="text-sm text-ardoise">
              {t("partner.dashboard.smallGroup", { minGroup: data.minGroup })}
            </p>
          </section>

          <section aria-labelledby="months" className="flex flex-col gap-3">
            <h2 id="months" className="text-h2">
              {t("partner.dashboard.months.title")}
            </h2>
            <Table caption={t("partner.dashboard.usage.chartAria")}>
              <thead>
                <tr>
                  <Th>{t("partner.dashboard.months.month")}</Th>
                  <Th>{t("partner.dashboard.kpi.active")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((row) => (
                  <tr key={row.month.toISOString()}>
                    <Td>{month.format(row.month)}</Td>
                    <Td>{show(row.active)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>

          <section aria-labelledby="batches" className="flex flex-col gap-3">
            <h2 id="batches" className="text-h2">
              {t("partner.dashboard.batches.title")}
            </h2>
            <ul className="flex flex-col gap-2">
              {data.batches.map((batch) => (
                <li key={batch.id} className="flex flex-col gap-1 rounded-card bg-blanc p-4">
                  <span className="font-semibold">
                    {t("partner.dashboard.batches.row", {
                      batchName: batch.name,
                      plan: batch.plan.name,
                      activated: batch.activated,
                      total: batch.seats,
                    })}
                  </span>
                  <span className="text-sm text-ardoise">
                    {t("partner.dashboard.batches.period", {
                      start: batch.startsAt,
                      end: batch.endsAt,
                    })}
                  </span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/app/partenaire/licences" variant="secondary" className="self-start">
              {t("partner.dashboard.batches.seeAll")}
            </ButtonLink>
          </section>
        </>
      )}
      <p className="text-sm text-ardoise">{t("partner.dashboard.contact")}</p>
    </div>
  );
}
