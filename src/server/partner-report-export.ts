/**
 * Rows of a partner impact report, shared by the page and the PDF export: section, indicator,
 * value. Hidden cells (fewer than `minGroup` people) read « Masqué ».
 */
import "server-only";
import { getTranslations } from "next-intl/server";
import type { Cell, ImpactReport } from "@/server/services/partners";

export async function partnerReportRows(report: ImpactReport) {
  const t = await getTranslations("partner");
  const number = new Intl.NumberFormat("fr");
  const show = (value: Cell) => (value.hidden ? t("hidden") : number.format(value.value ?? 0));
  const section = (key: "reach" | "learning" | "career" | "employment") =>
    t(`reports.section.${key}`);
  return [
    {
      section: section("reach"),
      name: t("reports.metric.activated"),
      value: show(report.reach.activated),
    },
    {
      section: section("reach"),
      name: t("reports.metric.activeMonthly"),
      value: show(report.reach.active),
    },
    {
      section: section("learning"),
      name: t("reports.metric.coursesStarted"),
      value: show(report.learning.coursesStarted),
    },
    {
      section: section("learning"),
      name: t("reports.metric.coursesCompleted"),
      value: show(report.learning.coursesCompleted),
    },
    {
      section: section("learning"),
      name: t("reports.metric.certificates"),
      value: show(report.learning.certificates),
    },
    {
      section: section("learning"),
      name: t("reports.metric.avgHours"),
      value: show(report.learning.avgHours),
    },
    {
      section: section("learning"),
      name: t("reports.metric.topThemes"),
      value: report.learning.topThemes.length
        ? report.learning.topThemes.map((theme) => theme.category).join(", ")
        : t("hidden"),
    },
    {
      section: section("career"),
      name: t("reports.metric.profilesCompleted", { percent: report.career.profilePercent }),
      value: show(report.career.profilesCompleted),
    },
    { section: section("career"), name: t("reports.metric.cvs"), value: show(report.career.cvs) },
    {
      section: section("career"),
      name: t("reports.metric.interviewSims"),
      value: show(report.career.interviewSims),
    },
    {
      section: section("employment"),
      name: t("reports.metric.applications"),
      value: show(report.employment.applications),
    },
    {
      section: section("employment"),
      name: t("reports.metric.interviews"),
      value: show(report.employment.interviews),
    },
    {
      section: section("employment"),
      name: t("reports.metric.hiresDeclared"),
      value: show(report.employment.hiresDeclared),
    },
  ];
}
