import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { Initials, Kpi, MenuChip, menuItem, stageTone } from "@/components/hire/kit";
import { EmptyState, PlanLock, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { reasonLabel } from "@/server/hire-report-export";
import {
  buildReport,
  periodRange,
  reportLevels,
  reportPeriods,
  reportRank,
} from "@/server/services/hire-reports";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.reports");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const card = "flex min-w-0 flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-6";
const cardTitle = "text-[18px] leading-6 font-semibold tracking-[-0.01em]";
const sectionTitle = "text-[22px] leading-7 font-semibold tracking-[-0.015em]";
const th = "px-4 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase";
const td = "px-4 py-3.5 text-[13.5px]";
const sourceTone = ["stroke-sapin", "stroke-lime", "stroke-menthe-claire"] as const;
const sourceDot = ["bg-sapin", "bg-lime", "bg-menthe-claire"] as const;
const recommendationKey = {
  strong_yes: "strongYes",
  yes: "yes",
  no: "no",
  strong_no: "strongNo",
} as const;

/** One horizontal bar with its label and value (decisions, teams, departments). */
function BarLine({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  return (
    <li className="flex flex-col gap-1.5">
      <p className="flex justify-between gap-3 text-[12.5px] leading-4">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 font-semibold">{value}</span>
      </p>
      <span aria-hidden className="block h-2 overflow-hidden rounded-pill bg-gris-clair">
        <span
          className="jm-gauge block h-full origin-left rounded-pill bg-ia"
          style={{ transform: `scaleX(${Math.max(0, Math.min(1, ratio))})` }}
        />
      </span>
    </li>
  );
}

/**
 * Reports (E8, `reports.level`, `reports.export`), mockup 04-09: each level adds sections to the
 * previous one. Aggregates only; the levels above the plan are shown locked.
 */
export default async function ReportsPage({ searchParams }: PageProps<"/app/hire/rapports">) {
  const query = await searchParams;
  const { ctx, space } = await requireHire("/app/hire/rapports");
  if (ctx.role === "hiring_manager") notFound();
  const t = await getTranslations();
  const th_ = await getTranslations("hire");
  const format = await getFormatter();
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
  const rank = reportRank(report.level);
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
  const decimal = (value: number) => format.number(value, { maximumFractionDigits: 1 });
  const days = (value: number | null) =>
    value === null ? t("hire.reports.none") : t("hire.reports.days", { days: decimal(value) });
  const percent = (part: number, total: number) =>
    total === 0 ? 0 : Math.round((part / total) * 100);
  const empty = report.basic.applications === 0;

  const exportLinks = exportable
    ? (["csv", "pdf"] as const).map((kind) => ({
        kind,
        href: `/app/hire/rapports/export?${periodQuery}&format=${kind}`,
        label: t(`hire.reports.export.${kind}`),
      }))
    : [];

  const periods = (
    <nav
      aria-label={t("hire.reports.period.text")}
      className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <span className="text-[13px] text-ardoise max-lg:hidden">
        {t("hire.reports.period.text")}
      </span>
      <div className="flex shrink-0 gap-1 lg:rounded-pill lg:bg-blanc lg:p-1">
        {reportPeriods.map((value) => {
          const active = value === "custom" ? custom : !custom && range.period === value;
          return (
            <Link
              key={value}
              href={
                value === "custom"
                  ? `/app/hire/rapports?periode=custom#periode`
                  : `/app/hire/rapports?periode=${value}`
              }
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex h-9 shrink-0 items-center rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap",
                active
                  ? "bg-sapin text-blanc"
                  : "bg-blanc ring-[1.5px] ring-brume ring-inset hover:bg-creme lg:ring-0",
              )}
            >
              {t(`hire.reports.period.${value}`)}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={t("hire.pipeline.eyebrow", { org: space.organization.name })}
        title={t("hire.reports.title")}
        actions={
          exportable ? (
            <>
              {exportLinks.map((link) => (
                <a
                  key={link.kind}
                  href={link.href}
                  className={pillClass(
                    link.kind === "pdf" ? "lime" : "outline",
                    "md",
                    "max-lg:hidden",
                  )}
                >
                  <Icon name="telecharger" className="size-4" />
                  {link.label}
                </a>
              ))}
              <MenuChip
                group="report-export"
                align="right"
                className="lg:hidden"
                summaryClassName={pillClass("lime", "sm")}
                summary={
                  <>
                    <Icon name="telecharger" className="size-4" />
                    {t("hire.reports.export.text")}
                  </>
                }
              >
                {exportLinks.map((link) => (
                  <a key={link.kind} href={link.href} className={menuItem}>
                    <Icon name="telecharger" />
                    {link.label}
                  </a>
                ))}
              </MenuChip>
            </>
          ) : (
            <PlanLock compact plan={orgPlanFor(plans, "reports.export")} />
          )
        }
      />

      {periods}
      {custom && (
        <form
          id="periode"
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-[24px] bg-blanc p-4"
        >
          <input type="hidden" name="periode" value="custom" />
          <TextField
            id="report-from"
            name="du"
            type="date"
            label={t("hire.reports.period.from")}
            defaultValue={raw.du ? day(range.from) : ""}
            required
          />
          <TextField
            id="report-to"
            name="au"
            type="date"
            label={t("hire.reports.period.to")}
            defaultValue={raw.au ? day(range.to) : ""}
            required
          />
          <button type="submit" className={pillClass("dark", "md")}>
            {t("hire.reports.period.apply")}
          </button>
        </form>
      )}

      <section aria-labelledby="vue" className="flex flex-col gap-3">
        <h2 id="vue" className={sectionTitle}>
          {t("hire.reports.basic.title")}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          <Kpi
            label={t("hire.reports.basic.activeJobs")}
            value={String(report.basic.activeJobs)}
            number={report.basic.activeJobs}
            icon="jobs"
            disc="bg-lime-clair"
          />
          <Kpi
            label={t("hire.reports.basic.applications")}
            value={String(report.basic.applications)}
            number={report.basic.applications}
            icon="equipe"
            disc="bg-ambre-fond"
          />
          <Kpi
            label={t("hire.reports.basic.hires")}
            value={String(report.basic.hires)}
            number={report.basic.hires}
            icon="check"
            disc="bg-menthe-claire"
          />
          {report.stats && (
            <>
              <Kpi
                label={t("hire.reports.stats.timeToHire.text")}
                value={
                  report.stats.timeToHire === null
                    ? "—"
                    : t("hire.reports.stats.timeToHire.value", {
                        days: decimal(report.stats.timeToHire),
                      })
                }
                icon="horloge"
              />
              <Kpi
                label={t("hire.reports.stats.responseTime")}
                value={report.stats.responseTime === null ? "—" : days(report.stats.responseTime)}
                icon="connect"
                className="max-lg:hidden"
              />
            </>
          )}
        </div>
        {empty && <EmptyState title={t("hire.reports.empty")} />}
      </section>

      {report.stats && !empty && (
        <section aria-labelledby="stats" className="flex flex-col gap-3">
          <h2 id="stats" className={sectionTitle}>
            {t("hire.reports.stats.title")}
          </h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className={card}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={cardTitle}>{t("hire.reports.stats.funnel")}</h3>
                <span className="text-[12px] text-ardoise">
                  {t("hire.reports.stats.conversion")}
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {report.stats.funnel.map((step, index) => {
                  const rate = report.stats!.conversion[index]?.rate ?? null;
                  const max = report.stats!.funnel[0]!.count || 1;
                  return (
                    <li
                      key={step.kind}
                      className="grid grid-cols-[84px_minmax(0,1fr)_52px] items-center gap-3 lg:grid-cols-[100px_minmax(0,1fr)_52px]"
                    >
                      <span className="truncate text-[13px]">
                        {t(`hire.pipeline.stage.${step.kind}`)}
                      </span>
                      <span className="relative h-7 overflow-hidden rounded-[9px] bg-creme">
                        <span
                          aria-hidden
                          className={cx(
                            "jm-gauge absolute inset-y-0 left-0 w-full origin-left rounded-[9px]",
                            stageTone[step.kind],
                          )}
                          style={{
                            transform: `scaleX(${Math.max(0.03, step.count / max)})`,
                          }}
                        />
                        <span className="relative flex h-full items-center px-2.5 text-[11.5px] font-semibold">
                          {step.count}
                        </span>
                      </span>
                      <span className="justify-self-end">
                        {rate !== null && (
                          <span className="inline-flex h-6 items-center rounded-pill bg-gris-clair px-2 text-[11px] font-semibold whitespace-nowrap">
                            {t("hire.reports.rate", { rate })}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className={card}>
              <h3 className={cardTitle}>{t("hire.reports.stats.sources")}</h3>
              <div className="flex flex-col items-center gap-5 lg:flex-row lg:gap-6">
                {(() => {
                  const total = report.stats.sources.reduce((sum, item) => sum + item.count, 0);
                  const radius = 52;
                  const circumference = 2 * Math.PI * radius;
                  let offset = 0;
                  return (
                    <span className="relative grid size-[150px] shrink-0 place-items-center">
                      <svg
                        viewBox="0 0 140 140"
                        aria-hidden
                        className="absolute inset-0 size-full -rotate-90"
                      >
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="none"
                          strokeWidth="20"
                          className="stroke-gris-clair"
                        />
                        {report.stats.sources.map((item, index) => {
                          const length = total ? (item.count / total) * circumference : 0;
                          const element = (
                            <circle
                              key={item.source}
                              cx="70"
                              cy="70"
                              r={radius}
                              fill="none"
                              strokeWidth="20"
                              className={sourceTone[index]}
                              strokeDasharray={`${length} ${circumference - length}`}
                              strokeDashoffset={-offset}
                            />
                          );
                          offset += length;
                          return element;
                        })}
                      </svg>
                      <span className="relative flex flex-col items-center">
                        <span className="text-[24px] leading-7 font-semibold">{total}</span>
                        <span className="text-[11px] text-ardoise">
                          {t("hire.reports.stats.sourcesTotal", { count: total })}
                        </span>
                      </span>
                    </span>
                  );
                })()}
                <ul className="flex w-full flex-col gap-2.5">
                  {report.stats.sources.map((item, index) => (
                    <li key={item.source} className="flex items-center gap-2.5 text-[13px]">
                      <span aria-hidden className={cx("size-2.5 rounded-full", sourceDot[index])} />
                      <span className="flex-1">{t(`hire.reports.source.${item.source}`)}</span>
                      <span className="font-semibold">
                        {t("hire.reports.rate", {
                          rate: percent(item.count, report.basic.applications),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {report.stats.byJob.length > 0 && (
            <>
              <h3 className="mt-1 text-[16px] font-semibold">{t("hire.reports.stats.byJob")}</h3>
              <div
                tabIndex={0}
                role="region"
                aria-label={t("hire.reports.stats.byJob")}
                className="overflow-x-auto rounded-[24px] bg-blanc"
              >
                <table className="w-full min-w-[480px]">
                  <caption className="sr-only">{t("hire.reports.stats.byJob")}</caption>
                  <thead className="border-b border-gris-clair">
                    <tr>
                      <th scope="col" className={th}>
                        {t("hire.reports.col.job")}
                      </th>
                      <th scope="col" className={th}>
                        {t("hire.reports.col.applications")}
                      </th>
                      <th scope="col" className={th}>
                        {t("hire.reports.col.hires")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gris-clair">
                    {report.stats.byJob.map((row, index) => (
                      <tr key={index}>
                        <th scope="row" className={cx(td, "text-left font-semibold")}>
                          {row.title}
                        </th>
                        <td className={td}>{row.applications}</td>
                        <td className={td}>{row.hires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {report.advanced && !empty && (
        <section aria-labelledby="avance" className="flex flex-col gap-3">
          <h2 id="avance" className={sectionTitle}>
            {t("hire.reports.advanced.title")}
          </h2>
          <div
            className={cx(
              "grid grid-cols-[minmax(0,1fr)] gap-4",
              report.advanced.byRecruiter.length > 0 &&
                "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]",
            )}
          >
            {report.advanced.byRecruiter.length > 0 && (
              <div className="flex min-w-0 flex-col gap-3 max-lg:order-last">
                <h3 className="text-[16px] font-semibold">
                  {t("hire.reports.advanced.byRecruiter")}
                </h3>
                <div
                  tabIndex={0}
                  role="region"
                  aria-label={t("hire.reports.advanced.byRecruiter")}
                  className="overflow-x-auto rounded-[24px] bg-blanc"
                >
                  <table className="w-full min-w-[460px]">
                    <caption className="sr-only">{t("hire.reports.advanced.byRecruiter")}</caption>
                    <thead className="border-b border-gris-clair">
                      <tr>
                        <th scope="col" className={th}>
                          {t("hire.reports.col.recruiter")}
                        </th>
                        <th scope="col" className={th}>
                          {t("hire.reports.col.moves")}
                        </th>
                        <th scope="col" className={th}>
                          {t("hire.reports.col.decisions")}
                        </th>
                        <th scope="col" className={th}>
                          {t("hire.reports.col.notes")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gris-clair">
                      {report.advanced.byRecruiter.map((row, index) => (
                        <tr key={index}>
                          <th scope="row" className={cx(td, "text-left font-semibold")}>
                            <span className="flex items-center gap-2.5">
                              <Initials name={row.name} size={28} />
                              {row.name}
                            </span>
                          </th>
                          <td className={td}>{row.moves}</td>
                          <td className={td}>{row.decisions}</td>
                          <td className={td}>{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className={card}>
              <h3 className={cardTitle}>{t("hire.reports.advanced.decisions")}</h3>
              {report.advanced.decisions.length === 0 ? (
                <p className="text-[13px] text-ardoise">{t("hire.reports.none")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {(() => {
                    const total = report.advanced.decisions.reduce(
                      (sum, item) => sum + item.count,
                      0,
                    );
                    return report.advanced.decisions.map((item) => (
                      <BarLine
                        key={item.reason}
                        label={reasonLabel(th_, item.reason)}
                        value={t("hire.reports.rate", { rate: percent(item.count, total) })}
                        ratio={item.count / total}
                      />
                    ));
                  })()}
                </ul>
              )}
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
            <div className={card}>
              <h3 className={cardTitle}>{t("hire.reports.advanced.candidateExperience")}</h3>
              <div className="flex items-center gap-5">
                {(() => {
                  const value = report.advanced.candidateExperience;
                  const ring = 2 * Math.PI * 38;
                  return (
                    <span className="relative grid size-[92px] shrink-0 place-items-center">
                      <svg
                        viewBox="0 0 90 90"
                        aria-hidden
                        className="absolute inset-0 size-full -rotate-90"
                      >
                        <circle
                          cx="45"
                          cy="45"
                          r="38"
                          fill="none"
                          strokeWidth="8"
                          className="stroke-gris-clair"
                        />
                        <circle
                          cx="45"
                          cy="45"
                          r="38"
                          fill="none"
                          strokeWidth="8"
                          strokeLinecap="round"
                          className="jm-ring stroke-feuille"
                          strokeDasharray={ring}
                          strokeDashoffset={ring * (1 - (value ?? 0) / 100)}
                        />
                      </svg>
                      <span className="text-[19px] font-semibold">
                        {value === null ? "—" : t("hire.reports.rate", { rate: value })}
                      </span>
                    </span>
                  );
                })()}
                <p className="text-[13px] leading-[19px] text-ardoise">
                  {t("hire.reports.advanced.candidateExperienceHint")}
                </p>
              </div>
            </div>
            <div className={card}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={cardTitle}>{t("hire.reports.advanced.scorecards")}</h3>
                <span className="text-[12px] text-ardoise">
                  {t("hire.reports.scorecards.average")}
                </span>
              </div>
              <p className="text-[13px]">
                {t("hire.reports.scorecards.summary", {
                  count: report.advanced.scorecards.count,
                  average:
                    report.advanced.scorecards.average === null
                      ? "—"
                      : decimal(report.advanced.scorecards.average),
                })}
              </p>
              {report.advanced.scorecards.count > 0 && (
                <ul
                  aria-label={t("hire.reports.scorecards.recommendations")}
                  className="flex flex-col gap-3"
                >
                  {report.advanced.scorecards.recommendations.map((item) => (
                    <BarLine
                      key={item.value}
                      label={th_(`scorecard.recommendation.${recommendationKey[item.value]}`)}
                      value={String(item.count)}
                      ratio={item.count / report.advanced!.scorecards.count}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {report.consolidated && !empty && (
        <section aria-labelledby="consolide" className="flex flex-col gap-3">
          <h2 id="consolide" className={sectionTitle}>
            {t("hire.reports.consolidated.title")}
          </h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
            {(
              [
                ["byTeam", report.consolidated.byTeam, true],
                ["byDepartment", report.consolidated.byDepartment, false],
              ] as const
            ).map(([key, rows, share]) => {
              const total = rows.reduce((sum, row) => sum + row.applications, 0);
              const max = Math.max(1, ...rows.map((row) => row.applications));
              return (
                <div key={key} className={card}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className={cardTitle}>{t(`hire.reports.consolidated.${key}`)}</h3>
                    <span className="text-[12px] text-ardoise">
                      {share
                        ? t("hire.reports.consolidated.share")
                        : t("hire.reports.col.applications")}
                    </span>
                  </div>
                  {rows.length === 0 ? (
                    <p className="text-[13px] text-ardoise">{t("hire.reports.none")}</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {rows.map((row) => (
                        <BarLine
                          key={row.name}
                          label={row.name}
                          value={
                            share
                              ? t("hire.reports.rate", { rate: percent(row.applications, total) })
                              : String(row.applications)
                          }
                          ratio={share ? row.applications / (total || 1) : row.applications / max}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {report.custom && !empty && (
        <section aria-labelledby="personnalise" className="flex flex-col gap-3">
          <h2 id="personnalise" className={sectionTitle}>
            {t("hire.reports.custom.title")}
          </h2>
          <div className={card}>
            <h3 className={cardTitle}>{t("hire.reports.custom.byEntity")}</h3>
            {report.custom.byEntity.length === 0 ? (
              <p className="text-[13px] text-ardoise">{t("hire.reports.none")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {(() => {
                  const max = Math.max(1, ...report.custom.byEntity.map((row) => row.applications));
                  return report.custom.byEntity.map((row) => (
                    <BarLine
                      key={row.name}
                      label={row.name}
                      value={String(row.applications)}
                      ratio={row.applications / max}
                    />
                  ));
                })()}
              </ul>
            )}
            <p className="text-[12.5px] leading-[18px] text-ardoise">
              {t("hire.reports.custom.note")}
            </p>
          </div>
        </section>
      )}

      {locks.map(([value, key]) => {
        const plan = orgPlanFor(plans, "reports.level", reportLevels.slice(reportRank(value)));
        return <PlanLock key={value} plan={plan} description={t(key, { plan })} />;
      })}
      <p className="flex items-start gap-2 text-[12px] leading-[17px] text-ardoise">
        <Icon name="lock" className="mt-px size-3.5 shrink-0" />
        {t("hire.reports.export.privacy")}
      </p>
    </div>
  );
}
