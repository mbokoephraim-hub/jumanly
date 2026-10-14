/**
 * Report export (`reports.export`): the same sections as the « Rapports » page, flattened into
 * rows « section · name · value ». Aggregates only, plus the names of the organization's members.
 */
import "server-only";
import { getTranslations } from "next-intl/server";
import { rejectReasons } from "@/server/services/hire";
import type { HireReport } from "@/server/services/hire-reports";

export type ReportRow = { section: string; name: string; value: string };

const recommendationKey = {
  strong_yes: "strongYes",
  yes: "yes",
  no: "no",
  strong_no: "strongNo",
} as const;

export async function reportRows(report: HireReport): Promise<ReportRow[]> {
  const t = await getTranslations("hire");
  const rows: ReportRow[] = [];
  const add = (section: string, name: string, value: string | number) =>
    rows.push({ section, name, value: String(value) });
  const none = t("reports.none");

  const basic = t("reports.basic.title");
  add(basic, t("reports.basic.activeJobs"), report.basic.activeJobs);
  add(basic, t("reports.basic.applications"), report.basic.applications);
  add(basic, t("reports.basic.hires"), report.basic.hires);

  if (report.stats) {
    const funnel = t("reports.stats.funnel");
    for (const step of report.stats.funnel)
      add(funnel, t(`pipeline.stage.${step.kind}`), step.count);
    const conversion = t("reports.stats.conversion");
    for (const step of report.stats.conversion.slice(1))
      add(
        conversion,
        t(`pipeline.stage.${step.kind}`),
        step.rate === null ? none : t("reports.rate", { rate: step.rate }),
      );
    const stats = t("reports.stats.title");
    add(
      stats,
      t("reports.stats.timeToHire.text"),
      report.stats.timeToHire === null
        ? none
        : t("reports.stats.timeToHire.value", { days: report.stats.timeToHire }),
    );
    add(
      stats,
      t("reports.stats.responseTime"),
      report.stats.responseTime === null
        ? none
        : t("reports.stats.timeToHire.value", { days: report.stats.responseTime }),
    );
    const sources = t("reports.stats.sources");
    for (const source of report.stats.sources)
      add(sources, t(`reports.source.${source.source}`), source.count);
    const byJob = t("reports.stats.byJob");
    for (const job of report.stats.byJob)
      add(byJob, job.title, `${job.applications} / ${job.hires}`);
  }

  if (report.advanced) {
    const byRecruiter = t("reports.advanced.byRecruiter");
    for (const row of report.advanced.byRecruiter)
      add(
        byRecruiter,
        row.name,
        [
          `${t("reports.col.moves")} ${row.moves}`,
          `${t("reports.col.decisions")} ${row.decisions}`,
          `${t("reports.col.notes")} ${row.notes}`,
        ].join(" · "),
      );
    const scorecards = t("reports.advanced.scorecards");
    add(
      scorecards,
      t("reports.col.count"),
      t("reports.scorecards.summary", {
        count: report.advanced.scorecards.count,
        average: report.advanced.scorecards.average ?? none,
      }),
    );
    for (const item of report.advanced.scorecards.recommendations)
      add(scorecards, t(`scorecard.recommendation.${recommendationKey[item.value]}`), item.count);
    const decisions = t("reports.advanced.decisions");
    for (const item of report.advanced.decisions)
      add(decisions, reasonLabel(t, item.reason), item.count);
    add(
      t("reports.advanced.title"),
      t("reports.advanced.candidateExperience"),
      report.advanced.candidateExperience === null
        ? none
        : t("reports.rate", { rate: report.advanced.candidateExperience }),
    );
  }

  if (report.consolidated) {
    const byTeam = t("reports.consolidated.byTeam");
    for (const row of report.consolidated.byTeam)
      add(byTeam, row.name, `${row.applications} / ${row.hires}`);
    const byDepartment = t("reports.consolidated.byDepartment");
    for (const row of report.consolidated.byDepartment)
      add(byDepartment, row.name, `${row.applications} / ${row.hires}`);
  }

  if (report.custom) {
    const byEntity = t("reports.custom.byEntity");
    for (const row of report.custom.byEntity)
      add(byEntity, row.name, `${row.applications} / ${row.hires}`);
  }
  return rows;
}

export function reasonLabel(
  t: Awaited<ReturnType<typeof getTranslations<"hire">>>,
  reason: string,
) {
  const known = rejectReasons.find((item) => item === reason) ?? "other";
  return t(`reject.reason.${known}`);
}
