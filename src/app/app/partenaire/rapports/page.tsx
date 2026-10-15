import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Logo } from "@/components/brand/logo";
import { AppPageHeader } from "@/components/app/page-header";
import { IconTile, pillClass } from "@/components/career/kit";
import { MenuChip, menuItem } from "@/components/hire/kit";
import {
  Figure,
  hatch,
  MaskedNote,
  MonthBars,
  partnerCard,
  partnerTitle,
} from "@/components/partner/kit";
import { EmptyState, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { requirePartner } from "@/server/partner-context";
import { periodRange, reportPeriods } from "@/server/services/hire-reports";
import { impactReport, listBatches, monthlyActive, type Cell } from "@/server/services/partners";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partner.reports");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const filterChip =
  "flex h-12 w-full items-center gap-2.5 rounded-[14px] bg-blanc px-4 text-[14px] ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 lg:min-w-[300px]";

/** Numbered section card of the report (01 Portée … 04 Accès à l'emploi). */
function ReportSection({
  id,
  index,
  icon,
  tone,
  title,
  children,
  className,
}: {
  id: string;
  index: number;
  icon: IconName;
  tone: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cx(partnerCard, "gap-4", className)}>
      <div className="flex items-center gap-3">
        <IconTile icon={icon} tone={tone} size="sm" />
        <h2 id={id} className={cx(partnerTitle, "flex-1")}>
          {title}
        </h2>
        <span aria-hidden className="text-[12px] font-semibold tracking-[0.08em] text-ardoise">
          {String(index).padStart(2, "0")}
        </span>
      </div>
      {children}
    </section>
  );
}

/**
 * Impact reports (partie 07 § 5, partie 10 § 10.2, mockup 06-03): totals, averages and rates only,
 * each cell hidden below the anonymity threshold, the same figures as the PDF export.
 */
export default async function PartnerReportsPage({
  searchParams,
}: PageProps<"/app/partenaire/rapports">) {
  const query = await searchParams;
  const raw = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
  const { ctx, organization } = await requirePartner("/app/partenaire/rapports");
  const t = await getTranslations();
  const batches = await listBatches(db, ctx);
  const batchId = batches.some((batch) => batch.id === raw.lot) ? raw.lot : undefined;
  const range = periodRange(raw);
  const [report, months, byBatch] = await Promise.all([
    impactReport(db, ctx, { batchId, from: range.from, to: range.to }),
    monthlyActive(db, ctx, { batchId, now: range.to }),
    batchId || batches.length < 2
      ? Promise.resolve([])
      : Promise.all(
          batches.map(async (batch) => ({
            batch,
            hires: (
              await impactReport(db, ctx, { batchId: batch.id, from: range.from, to: range.to })
            ).employment.hiresDeclared,
          })),
        ),
  ]);
  const number = new Intl.NumberFormat("fr");
  const decimal = new Intl.NumberFormat("fr", { maximumFractionDigits: 1 });
  const show = (value: Cell) =>
    value.hidden ? t("partner.hidden") : number.format(value.value ?? 0);
  const custom = raw.periode === "custom";
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const params = new URLSearchParams(
    custom
      ? { periode: "custom", du: day(range.from), au: day(range.to) }
      : { periode: range.period },
  );
  if (batchId) params.set("lot", batchId);
  const href = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    if (merged.get("periode") !== "custom") {
      merged.delete("du");
      merged.delete("au");
    }
    return `/app/partenaire/rapports?${merged}`;
  };
  const selected = batches.filter((batch) => !batchId || batch.id === batchId);
  const distributed = selected.reduce((sum, batch) => sum + batch.distributed, 0);
  const monthName = new Intl.DateTimeFormat("fr", { month: "short", timeZone: "UTC" });
  const monthLong = new Intl.DateTimeFormat("fr", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const population = report.population ?? 0;
  const anyHidden = [
    report.reach.activated,
    report.reach.active,
    report.learning.coursesStarted,
    report.learning.coursesCompleted,
    report.learning.certificates,
    report.learning.avgHours,
    report.career.profilesCompleted,
    report.career.cvs,
    report.career.interviewSims,
    report.employment.applications,
    report.employment.interviews,
    report.employment.hiresDeclared,
    ...byBatch.map((row) => row.hires),
    ...months.map((row) => row.active),
  ].some((value) => value.hidden);

  /** A figure tile: value (hatched « Masqué » when hidden), label, optional second line. */
  const tile = (
    key: string,
    value: Cell,
    label: string,
    options: { text?: string; sub?: string; tone?: string } = {},
  ) => (
    <li
      key={key}
      className={cx("flex min-w-0 flex-col rounded-[18px] px-4 py-3.5", options.tone ?? "bg-creme")}
      style={value.hidden ? hatch : undefined}
    >
      <span className="text-[24px] leading-8 font-semibold tracking-[-0.03em] lg:text-[28px] lg:leading-9">
        {value.hidden
          ? t("partner.hidden")
          : (options.text ?? <Figure value={show(value)} number={value.value} />)}
      </span>
      <span className="text-[12px] leading-4 font-medium">{label}</span>
      {options.sub && (
        <span className="mt-1 text-[12px] leading-4 text-ardoise">{options.sub}</span>
      )}
    </li>
  );

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={t("partner.dashboard.eyebrow", { org: organization.name })}
        title={t("partner.reports.title")}
        subtitle={t("partner.reports.subtitle")}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
        <div className="flex flex-col gap-1.5">
          <span id="report-period" className="text-[13px] font-semibold">
            {t("partner.reports.period")}
          </span>
          <MenuChip
            group="report-filter"
            label={t("partner.reports.period")}
            summaryClassName={filterChip}
            summary={
              <>
                <Icon name="calendrier" className="size-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {t("partner.reports.range", { from: range.from, to: range.to })}
                </span>
                <Icon name="chev-d" className="size-4 shrink-0" />
              </>
            }
          >
            {reportPeriods.map((value) => {
              const active = value === "custom" ? custom : !custom && range.period === value;
              return (
                <Link
                  key={value}
                  href={
                    value === "custom"
                      ? `${href({ periode: "custom" })}#periode`
                      : href({ periode: value })
                  }
                  aria-current={active ? "true" : undefined}
                  className={cx(menuItem, "min-h-11", active && "font-semibold")}
                >
                  {t(`hire.reports.period.${value}`)}
                </Link>
              );
            })}
          </MenuChip>
        </div>
        {batches.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">{t("partner.reports.batch.text")}</span>
            <MenuChip
              group="report-filter"
              label={t("partner.reports.batch.text")}
              summaryClassName={cx(filterChip, "lg:min-w-[260px]")}
              summary={
                <>
                  <Icon name="certificat" className="size-[18px] shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {selected.length === 1 && batchId
                      ? selected[0]!.name
                      : t("partner.reports.batch.all")}
                  </span>
                  <Icon name="chev-d" className="size-4 shrink-0" />
                </>
              }
            >
              {[{ id: "", name: t("partner.reports.batch.all") }, ...batches].map((batch) => (
                <Link
                  key={batch.id || "all"}
                  href={href({ lot: batch.id || undefined })}
                  aria-current={(batchId ?? "") === batch.id ? "true" : undefined}
                  className={cx(
                    menuItem,
                    "min-h-11",
                    (batchId ?? "") === batch.id && "font-semibold",
                  )}
                >
                  {batch.name}
                </Link>
              ))}
            </MenuChip>
          </div>
        )}
        {report.enough && (
          <a
            href={`/app/partenaire/rapports/export?${params}`}
            className={pillClass("dark", "md", "h-12 lg:ml-auto")}
          >
            <Icon name="telecharger" className="size-4" />
            {t("partner.reports.export.pdf")}
          </a>
        )}
      </div>
      {custom && (
        <form
          id="periode"
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-[24px] bg-blanc p-4"
        >
          <input type="hidden" name="periode" value="custom" />
          {batchId && <input type="hidden" name="lot" value={batchId} />}
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
          <button type="submit" className={pillClass("dark", "md", "h-12")}>
            {t("partner.reports.batch.apply")}
          </button>
        </form>
      )}

      <section
        aria-labelledby="privacy"
        className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5 lg:flex-row lg:items-center lg:gap-5 lg:px-6"
      >
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-sapin text-lime lg:size-[52px]"
        >
          <Icon name="lock" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="privacy" className="text-[16px] leading-6 font-semibold">
            {t("partner.reports.privacy.title")}
          </h2>
          <p className="text-[13.5px] leading-5">{t("partner.reports.privacy.body")}</p>
        </div>
        <p className="flex items-center gap-2 self-start rounded-pill bg-neon px-4 py-2 text-[12.5px] leading-4 font-semibold lg:self-center">
          <Icon name="eye" className="size-4 shrink-0" />
          {t("partner.reports.privacy.threshold", { minGroup: report.minGroup })}
        </p>
      </section>

      {!report.enough ? (
        <EmptyState title={t("partner.reports.empty", { minGroup: report.minGroup })} />
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2 lg:gap-5">
            <div className="flex min-w-0 flex-col gap-4 max-lg:contents lg:gap-5">
              <ReportSection
                id="section-reach"
                index={1}
                icon="equipe"
                tone="bg-lime-clair"
                title={t("partner.reports.section.reach")}
              >
                <ul className="grid grid-cols-2 gap-3">
                  {tile(
                    "activated",
                    report.reach.activated,
                    t("partner.reports.metric.activated"),
                    { sub: t("partner.reports.metric.activatedOf", { count: distributed }) },
                  )}
                  {tile("active", report.reach.active, t("partner.reports.metric.activeMonthly"))}
                </ul>
                <MonthBars
                  label={t("partner.dashboard.usage.chartAria")}
                  months={months.map((row) => ({
                    key: row.month.toISOString(),
                    label: monthName.format(row.month),
                    value: row.active.hidden ? null : (row.active.value ?? 0),
                    text: t("partner.dashboard.months.value", {
                      month: monthLong.format(row.month),
                      value: show(row.active),
                    }),
                  }))}
                />
              </ReportSection>
              <ReportSection
                id="section-career"
                className="max-lg:order-last"
                index={3}
                icon="career"
                tone="bg-neon"
                title={t("partner.reports.section.career")}
              >
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {tile(
                    "profiles",
                    report.career.profilesCompleted,
                    t("partner.reports.metric.profilesCompleted", {
                      percent: report.career.profilePercent,
                    }),
                  )}
                  {tile("cvs", report.career.cvs, t("partner.reports.metric.cvs"))}
                  {tile(
                    "sims",
                    report.career.interviewSims,
                    t("partner.reports.metric.interviewSims"),
                  )}
                </ul>
              </ReportSection>
            </div>
            <ReportSection
              id="section-learning"
              index={2}
              icon="learn"
              tone="bg-lime"
              title={t("partner.reports.section.learning")}
            >
              <ul className="grid grid-cols-2 gap-3">
                {tile(
                  "started",
                  report.learning.coursesStarted,
                  t("partner.reports.metric.coursesStarted"),
                )}
                {tile(
                  "completed",
                  report.learning.coursesCompleted,
                  t("partner.reports.metric.coursesCompleted"),
                )}
                {tile(
                  "certificates",
                  report.learning.certificates,
                  t("partner.reports.metric.certificates"),
                )}
                {tile("avgHours", report.learning.avgHours, t("partner.reports.metric.avgHours"), {
                  text: t("partner.reports.hours", {
                    hours: decimal.format(report.learning.avgHours.value ?? 0),
                  }),
                })}
              </ul>
              <h3 className="mt-1 text-[14px] font-semibold">
                {t("partner.reports.metric.topThemes")}
              </h3>
              {report.learning.topThemes.length === 0 ? (
                <MaskedNote>
                  {t("partner.dashboard.smallGroup", { minGroup: report.minGroup })}
                </MaskedNote>
              ) : (
                <ul className="flex flex-col gap-3">
                  {report.learning.topThemes.map((theme) => {
                    const percent = population ? Math.round((theme.people / population) * 100) : 0;
                    return (
                      <li key={theme.category} className="flex flex-col gap-1.5">
                        <p className="flex justify-between gap-3 text-[12.5px] leading-4">
                          <span className="min-w-0 truncate">{theme.category}</span>
                          <span className="shrink-0 font-semibold">
                            {t("partner.reports.percent", { percent })}
                          </span>
                        </p>
                        <span
                          aria-hidden
                          className="block h-2 overflow-hidden rounded-pill bg-gris-clair"
                        >
                          <span
                            className="jm-gauge block h-full origin-left rounded-pill bg-feuille"
                            style={{ transform: `scaleX(${Math.min(1, percent / 100)})` }}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ReportSection>
          </div>

          <ReportSection
            id="section-employment"
            index={4}
            icon="jobs"
            tone="bg-menthe-claire"
            title={t("partner.reports.section.employment")}
          >
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {tile(
                "applications",
                report.employment.applications,
                t("partner.reports.metric.applications"),
              )}
              {tile(
                "interviews",
                report.employment.interviews,
                t("partner.reports.metric.interviews"),
              )}
              {tile(
                "hires",
                report.employment.hiresDeclared,
                t("partner.reports.metric.hiresDeclared"),
                { tone: "bg-lime-clair max-lg:col-span-2" },
              )}
            </ul>
            {byBatch.length > 0 && (
              <>
                <h3 className="mt-1 text-[14px] font-semibold">
                  {t("partner.reports.hiresByBatch")}
                </h3>
                <ul className="flex flex-col rounded-[18px] bg-creme px-4">
                  {byBatch.map(({ batch, hires }, index) => (
                    <li
                      key={batch.id}
                      className={cx(
                        "flex min-h-11 items-center justify-between gap-3 py-2.5 text-[13.5px]",
                        index > 0 && "border-t border-brume",
                      )}
                    >
                      <span className="min-w-0">{batch.name}</span>
                      {hires.hidden ? (
                        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-gris-clair px-3 text-[12px] font-semibold">
                          <Icon name="eye" className="size-3.5" />
                          {t("partner.hidden")}
                        </span>
                      ) : (
                        <span className="shrink-0 font-semibold">
                          {number.format(hires.value ?? 0)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {anyHidden && (
              <MaskedNote>
                {t("partner.dashboard.smallGroup", { minGroup: report.minGroup })}
              </MaskedNote>
            )}
          </ReportSection>
        </>
      )}

      <p className="flex items-start gap-3 rounded-[24px] bg-blanc px-5 py-4 text-[13px] leading-5 lg:px-6">
        <Icon name="message" className="mt-0.5 size-4 shrink-0" />
        {t("partner.reports.requestNominative")}
      </p>
      {report.enough && (
        <p className="flex items-start gap-2.5 text-[12px] text-ardoise lg:items-center lg:justify-center lg:text-center">
          <Logo variant="tile" height={22} />
          {t("partner.reports.export.footer", { date: new Date() })}
        </p>
      )}
    </div>
  );
}
