import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { OrbiLine } from "@/components/recruiter/offers";
import {
  ReportExportButton,
  ReportExportCardButton,
  ReportExportDialog,
} from "@/components/recruiter/report-export";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { buildReport, periodRange, reportRank } from "@/server/services/hire-reports";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.reports");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const sourceColor = { direct: "#2fd3a6", invitation: "#a6f26b", talent_search: "#f5b83d" } as const;

/**
 * Rapports (planche recruteur-3 `RAPPORT`, r3plus v2.3): the period (30 days, a quarter) or the
 * view by offer; the four figures; where the applications stand, stage by stage; the applications
 * by week; where they come from; an Orbi line read from the figures; then the PDF to export.
 * Aggregates of the organization only (golden rule n° 6); each `reports.level` adds sections.
 */
export default async function ReportsPage({ searchParams }: PageProps<"/app/hire/rapports">) {
  const query = await searchParams;
  const { ctx, space } = await requireHire("/app/hire/rapports");
  if (ctx.role === "hiring_manager") notFound();
  const t = await getTranslations("hire.reports");
  const tr = await getTranslations("rhReports");
  const tw = await getTranslations("hireWeb3.reports");
  const format = await getFormatter();
  const byJob = one(query.vue) === "offres";
  const periode = one(query.periode) === "90d" ? "90d" : "30d";
  const range = periodRange({ periode });
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [report, exportable, plans] = await Promise.all([
    buildReport(db, ctx, range),
    can(db, subject, "reports.export"),
    listPublicPlans(db),
  ]);
  const rank = reportRank(report.level);
  const { basic, stats } = report;
  const empty = basic.applications === 0;
  const href = (changes: { periode?: string; vue?: string | null }) => {
    const next = new URLSearchParams();
    const p = changes.periode ?? periode;
    if (p !== "30d") next.set("periode", p);
    const vue = changes.vue === undefined ? (byJob ? "offres" : null) : changes.vue;
    if (vue) next.set("vue", vue);
    const text = next.toString();
    return text ? `/app/hire/rapports?${text}` : "/app/hire/rapports";
  };
  const decimal = (value: number) => format.number(value, { maximumFractionDigits: 1 });
  const maxWeek = Math.max(1, ...basic.weekly);
  const top = Math.max(1, stats?.funnel[0]?.count ?? 0);
  const funnelRows = stats
    ? [
        { key: "received", count: stats.funnel[0]!.count },
        { key: "screened", count: stats.funnel[1]!.count },
        { key: "shortlisted", count: stats.funnel[2]!.count },
        { key: "interview", count: stats.funnel[3]!.count },
        { key: "hired", count: stats.funnel[5]!.count },
      ]
    : [];
  // An Orbi line read from the figures, written without the model.
  const last = basic.weekly[3]!;
  const before = basic.weekly[2]!;
  const insight = empty
    ? null
    : before > 0 && last >= before * 2
      ? tr("insight.doubled", { job: stats?.byJob[0]?.title ?? "" })
      : last > before
        ? tr("insight.up", { count: last - before })
        : stats && stats.responseTime !== null && stats.responseTime > 3
          ? tr("insight.slow", { days: decimal(stats.responseTime) })
          : tr("insight.steady", { count: basic.applications });
  const sourcesTotal = stats ? stats.sources.reduce((sum, item) => sum + item.count, 0) : 0;
  const month = format.dateTime(range.to, { month: "long" });

  return (
    <div className="t-flux t-w4 t-large t-rw3-rap">
      <div className="t-w4-h">
        <FlowHead back="/app/hire/compte" backLabel={tr("back")} title={t("title")} />
        <p className="t-w4-web t-w4-sub">
          {tw(periode === "90d" ? "sub90" : "sub30", { org: space.organization.name })}
        </p>
        {exportable && <ReportExportButton />}
      </div>
      {exportable && <ReportExportDialog periode={periode} activeJobs={basic.activeJobs} />}

      <nav aria-label={t("period.text")} className="t-rx-onglets">
        <Link
          href={href({ periode: "30d", vue: null })}
          aria-current={!byJob && periode === "30d" ? "page" : undefined}
          className="t-puce t-press"
        >
          {tr("period.30d")}
        </Link>
        <Link
          href={href({ periode: "90d", vue: null })}
          aria-current={!byJob && periode === "90d" ? "page" : undefined}
          className="t-puce t-press"
        >
          {tr("period.90d")}
        </Link>
        <Link
          href={href({ vue: "offres" })}
          aria-current={byJob ? "page" : undefined}
          className="t-puce t-press"
        >
          {tr("byJob")}
        </Link>
      </nav>

      <ul className="t-r5-st4" aria-label={tr("figures")}>
        <li className="t-r5-s1">
          <b>{basic.applications}</b>
          {tr("figure.applications", { count: basic.applications })}
        </li>
        <li className="t-r5-s2">
          {stats ? (
            <>
              <b>
                {stats.responseTime === null
                  ? "—"
                  : t("days", { days: decimal(stats.responseTime) })}
              </b>
              {tr("figure.responseTime")}
            </>
          ) : (
            <>
              <b>{basic.activeJobs}</b>
              {tr("figure.activeJobs", { count: basic.activeJobs })}
            </>
          )}
        </li>
        <li className="t-r5-s3">
          <b>{basic.interviews}</b>
          {tr("figure.interviews", { count: basic.interviews })}
        </li>
        <li className="t-r5-s4">
          <b>{basic.hires}</b>
          {tr("figure.hires", { count: basic.hires })}
        </li>
      </ul>

      {empty && (
        <div className="t-verre t-carte t-vide">
          <b>{t("empty")}</b>
        </div>
      )}

      {byJob ? (
        stats ? (
          <section className="t-verre t-carte t-r5-rp" aria-labelledby="r5-rp-offres">
            <h2 id="r5-rp-offres">{t("stats.byJob")}</h2>
            {stats.byJob.length === 0 ? (
              <p className="t-r5-vide-t">{t("empty")}</p>
            ) : (
              <ul className="t-r5-fr">
                {stats.byJob.map((row) => (
                  <li key={row.title}>
                    <span className="t-r5-fr-l">{row.title}</span>
                    <span className="t-r5-br" aria-hidden>
                      <i style={{ width: `${Math.round((row.applications / top) * 100)}%` }} />
                    </span>
                    <b>
                      {row.applications}
                      <span className="sr-only">
                        {tr("jobLine", { applications: row.applications, hires: row.hires })}
                      </span>
                    </b>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null
      ) : (
        <div className="t-rw3-rg">
          {stats && !empty && (
            <section className="t-verre t-carte t-r5-rp" aria-labelledby="r5-rp-etapes">
              <h2 id="r5-rp-etapes">{tr("funnel")}</h2>
              <ul className="t-r5-fr">
                {funnelRows.map((row) => (
                  <li key={row.key}>
                    <span className="t-r5-fr-l">{tr(`stage.${row.key}` as "stage.received")}</span>
                    <span className="t-r5-br" aria-hidden>
                      <i style={{ width: `${Math.round((row.count / top) * 100)}%` }} />
                    </span>
                    <b>{row.count}</b>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="t-verre t-carte t-r5-rp" aria-labelledby="r5-rp-sem">
            <div className="t-r5-rp-h">
              <h2 id="r5-rp-sem">{tr("weekly")}</h2>
              <span>{tr("weeklyLine")}</span>
            </div>
            <div
              className="t-rx-sem"
              role="img"
              aria-label={tr("weeklyAria", {
                s1: basic.weekly[0]!,
                s2: basic.weekly[1]!,
                s3: basic.weekly[2]!,
                s4: basic.weekly[3]!,
              })}
            >
              {basic.weekly.map((count, index) => (
                <div key={index} className={cx(index === 3 && "t-on")}>
                  <small>{count}</small>
                  <i style={{ height: `${Math.round((count / maxWeek) * 70)}%` }} />
                  {tr("week", { n: index + 1 })}
                </div>
              ))}
            </div>
          </section>

          {stats && sourcesTotal > 0 && (
            <section className="t-verre t-carte t-r5-rp" aria-labelledby="r5-rp-src">
              <h2 id="r5-rp-src">{tr("sources")}</h2>
              <span className="t-r5-stk" aria-hidden>
                {stats.sources
                  .filter((item) => item.count > 0)
                  .map((item) => (
                    <i
                      key={item.source}
                      style={{
                        width: `${(item.count / sourcesTotal) * 100}%`,
                        background: sourceColor[item.source],
                      }}
                    />
                  ))}
              </span>
              <ul className="t-r5-src">
                {stats.sources.map((item) => (
                  <li key={item.source}>
                    <i style={{ background: sourceColor[item.source] }} aria-hidden />
                    <span>{tr(`source.${item.source}`)}</span>
                    <b>{item.count}</b>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {insight && <OrbiLine>{insight}</OrbiLine>}

          {report.advanced && report.advanced.byRecruiter.length > 0 && (
            <section className="t-verre t-carte t-r5-rp" aria-labelledby="r5-rp-rec">
              <h2 id="r5-rp-rec">{t("advanced.byRecruiter")}</h2>
              <ul className="t-r5-src">
                {report.advanced.byRecruiter.map((row) => (
                  <li key={row.name}>
                    <span>{row.name}</span>
                    <b>
                      {tr("recruiterLine", {
                        moves: row.moves,
                        decisions: row.decisions,
                        notes: row.notes,
                      })}
                    </b>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(
            [
              ["byTeam", report.consolidated?.byTeam, t("consolidated.byTeam")],
              ["byDepartment", report.consolidated?.byDepartment, t("consolidated.byDepartment")],
              ["byEntity", report.custom?.byEntity, t("custom.byEntity")],
            ] as const
          ).map(([key, rows, title]) =>
            rows && rows.length > 0 ? (
              <section key={key} className="t-verre t-carte t-r5-rp" aria-label={title}>
                <h2>{title}</h2>
                <ul className="t-r5-src">
                  {rows.map((row) => (
                    <li key={row.name}>
                      <span>{row.name}</span>
                      <b>{tr("jobLine", { applications: row.applications, hires: row.hires })}</b>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}

      {rank < reportRank("stats") && (
        <div className="t-verre t-carte">
          <b>
            {t("stats.locked", {
              plan: orgPlanFor(plans, "reports.level", [
                "stats",
                "advanced",
                "consolidated",
                "custom",
              ]),
            })}
          </b>
          <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
            {tr("plans")}
          </Link>
        </div>
      )}

      <p className="t-gar">
        <TalentIcon name="pourquoi" size="s" />
        <span>{tr("rule")}</span>
      </p>

      {exportable ? (
        <>
          <div className="t-verre t-r5-pdf">
            <span className="t-r5-th" aria-hidden>
              <i />
              <em />
              <u />
              <u />
              <u />
            </span>
            <span className="t-t">
              <b>{tr("pdf.title", { month })}</b>
              <span>{tr("pdf.line")}</span>
            </span>
            <ReportExportCardButton />
          </div>
          <a
            href={`/app/hire/rapports/export?periode=${periode}`}
            className="t-bt t-p t-pl t-press t-w4-tel"
            download
          >
            <TalentIcon name="telecharger" size="s" />
            {tr("pdf.cta")}
          </a>
        </>
      ) : (
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          <span>{t("export.locked", { plan: orgPlanFor(plans, "reports.export") })}</span>
        </p>
      )}
    </div>
  );
}
