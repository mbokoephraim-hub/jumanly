import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  Select,
  Table,
  Td,
  TextField,
  Th,
} from "@/components/ui";
import { db } from "@/server/db";
import { requirePartner } from "@/server/partner-context";
import { partnerReportRows } from "@/server/partner-report-export";
import { periodRange, reportPeriods } from "@/server/services/hire-reports";
import { impactReport, listBatches } from "@/server/services/partners";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partner.reports");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Impact reports (partie 07 § 5, partie 10 § 10.2): totals only, cells under the threshold hidden. */
export default async function PartnerReportsPage({
  searchParams,
}: PageProps<"/app/partenaire/rapports">) {
  const query = await searchParams;
  const raw = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
  const { ctx } = await requirePartner("/app/partenaire/rapports");
  const t = await getTranslations();
  const batches = await listBatches(db, ctx);
  const batchId = batches.some((batch) => batch.id === raw.lot) ? raw.lot : undefined;
  const range = periodRange(raw);
  const report = await impactReport(db, ctx, { batchId, from: range.from, to: range.to });
  const rows = await partnerReportRows(report);
  const sections = [...new Set(rows.map((row) => row.section))];
  const custom = raw.periode === "custom";
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const params = new URLSearchParams(
    custom
      ? { periode: "custom", du: day(range.from), au: day(range.to) }
      : { periode: range.period },
  );
  if (batchId) params.set("lot", batchId);
  const withPeriod = (period: string) => {
    const next = new URLSearchParams({ periode: period });
    if (batchId) next.set("lot", batchId);
    return `/app/partenaire/rapports?${next}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1">{t("partner.reports.title")}</h1>
          <p className="text-ardoise">{t("partner.reports.subtitle")}</p>
        </div>
        {report.enough && (
          <ButtonLink
            href={`/app/partenaire/rapports/export?${params}`}
            prefetch={false}
            size="sm"
            variant="secondary"
          >
            {t("partner.reports.export.pdf")}
          </ButtonLink>
        )}
      </header>

      <Alert tone="info" title={t("partner.reports.privacy.title")}>
        <p>{t("partner.reports.privacy.body")}</p>
        <p>{t("partner.reports.privacy.threshold", { minGroup: report.minGroup })}</p>
      </Alert>

      <nav aria-label={t("partner.reports.period")} className="flex flex-wrap items-center gap-4">
        {reportPeriods
          .filter((value) => value !== "custom")
          .map((value) => (
            <Link
              key={value}
              href={withPeriod(value)}
              aria-current={!custom && range.period === value ? "page" : undefined}
              className={!custom && range.period === value ? "font-semibold" : "underline"}
            >
              {t(`hire.reports.period.${value}`)}
            </Link>
          ))}
      </nav>
      <form method="get" className="flex flex-wrap items-end gap-3">
        {batches.length > 1 && (
          <Select
            id="report-batch"
            name="lot"
            label={t("partner.reports.batch.text")}
            defaultValue={batchId ?? ""}
            options={[
              { value: "", label: t("partner.reports.batch.all") },
              ...batches.map((batch) => ({ value: batch.id, label: batch.name })),
            ]}
          />
        )}
        <input type="hidden" name="periode" value="custom" />
        <TextField
          id="report-from"
          name="du"
          type="date"
          label={t("hire.reports.period.from")}
          defaultValue={day(range.from)}
          required
        />
        <TextField
          id="report-to"
          name="au"
          type="date"
          label={t("hire.reports.period.to")}
          defaultValue={day(range.to)}
          required
        />
        <Button type="submit" size="sm" variant="tertiary">
          {t("partner.reports.batch.apply")}
        </Button>
      </form>

      {!report.enough ? (
        <EmptyState title={t("partner.reports.empty", { minGroup: report.minGroup })} />
      ) : (
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
                  .map((row) => (
                    <tr key={row.name}>
                      <Td>{row.name}</Td>
                      <Td>{row.value}</Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </section>
        ))
      )}
      <p className="text-sm text-ardoise">{t("partner.reports.requestNominative")}</p>
    </div>
  );
}
