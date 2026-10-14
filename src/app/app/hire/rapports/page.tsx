import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Button,
  ButtonLink,
  EmptyState,
  PlanLock,
  StatCard,
  Table,
  Td,
  Th,
  TextField,
} from "@/components/ui";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { reportRows } from "@/server/hire-report-export";
import {
  buildReport,
  periodRange,
  reportLevels,
  reportPeriods,
  reportRank,
} from "@/server/services/hire-reports";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.reports");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Reports (E8, `reports.level`, `reports.export`): each level adds sections to the previous one. */
export default async function ReportsPage({ searchParams }: PageProps<"/app/hire/rapports">) {
  const query = await searchParams;
  const { ctx } = await requireHire("/app/hire/rapports");
  if (ctx.role === "hiring_manager") notFound();
  const t = await getTranslations();
  const raw = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
  const range = periodRange(raw);
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [report, exportable, plans] = await Promise.all([
    buildReport(db, ctx, range),
    can(db, subject, "reports.export"),
    listPublicPlans(db),
  ]);
  const rows = await reportRows(report);
  const rank = reportRank(report.level);
  const sections = [...new Set(rows.map((row) => row.section))].slice(1);
  const custom = raw.periode === "custom";
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const periodQuery = new URLSearchParams(
    custom
      ? { periode: "custom", du: day(range.from), au: day(range.to) }
      : { periode: range.period },
  );
  const locks = (
    [
      ["stats", "hire.reports.stats.locked"],
      ["advanced", "hire.reports.advanced.locked"],
      ["consolidated", "hire.reports.consolidated.locked"],
      ["custom", "hire.reports.custom.locked"],
    ] as const
  ).filter(([value]) => reportRank(value) > rank);

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader
        title={t("hire.reports.title")}
        actions={
          exportable ? (
            <>
              <ButtonLink
                href={`/app/hire/rapports/export?${periodQuery}&format=csv`}
                prefetch={false}
                size="sm"
                variant="secondary"
              >
                {t("hire.reports.export.csv")}
              </ButtonLink>
              <ButtonLink
                href={`/app/hire/rapports/export?${periodQuery}&format=pdf`}
                prefetch={false}
                size="sm"
                variant="secondary"
              >
                {t("hire.reports.export.pdf")}
              </ButtonLink>
            </>
          ) : (
            <PlanLock compact plan={orgPlanFor(plans, "reports.export")} />
          )
        }
      />

      <nav aria-label={t("hire.reports.period.text")} className="flex flex-wrap items-center gap-4">
        {reportPeriods
          .filter((value) => value !== "custom")
          .map((value) => (
            <Link
              key={value}
              href={`/app/hire/rapports?periode=${value}`}
              aria-current={!custom && range.period === value ? "page" : undefined}
              className={!custom && range.period === value ? "font-semibold" : "underline"}
            >
              {t(`hire.reports.period.${value}`)}
            </Link>
          ))}
      </nav>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="periode" value="custom" />
        <TextField
          id="report-from"
          name="du"
          type="date"
          label={t("hire.reports.period.from")}
          defaultValue={custom ? day(range.from) : ""}
          required
        />
        <TextField
          id="report-to"
          name="au"
          type="date"
          label={t("hire.reports.period.to")}
          defaultValue={custom ? day(range.to) : ""}
          required
        />
        <Button type="submit" size="sm" variant="tertiary">
          {t("hire.reports.period.apply")}
        </Button>
      </form>

      <section aria-labelledby="vue" className="flex flex-col gap-3">
        <h2 id="vue" className="text-h2">
          {t("hire.reports.basic.title")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label={t("hire.reports.basic.activeJobs")}
            value={String(report.basic.activeJobs)}
          />
          <StatCard
            label={t("hire.reports.basic.applications")}
            value={String(report.basic.applications)}
          />
          <StatCard label={t("hire.reports.basic.hires")} value={String(report.basic.hires)} />
        </div>
        {report.basic.applications === 0 && <EmptyState title={t("hire.reports.empty")} />}
      </section>

      {report.basic.applications > 0 &&
        sections.map((section, index) => (
          <section
            key={section}
            aria-labelledby={`section-${index}`}
            className="flex flex-col gap-3"
          >
            <h2 id={`section-${index}`} className="text-h2">
              {section}
            </h2>
            <Table caption={section}>
              <thead>
                <tr>
                  <Th>{t("hire.reports.col.name")}</Th>
                  <Th>{t("hire.reports.col.value")}</Th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((row) => row.section === section)
                  .map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <Td>{row.name}</Td>
                      <Td>{row.value}</Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </section>
        ))}
      {report.custom && <p className="text-sm text-ardoise">{t("hire.reports.custom.note")}</p>}

      {locks.map(([value, key]) => {
        const plan = orgPlanFor(plans, "reports.level", reportLevels.slice(reportRank(value)));
        return <PlanLock key={value} plan={plan} description={t(key, { plan })} />;
      })}
      <p className="text-sm text-ardoise">{t("hire.reports.export.privacy")}</p>
    </div>
  );
}
