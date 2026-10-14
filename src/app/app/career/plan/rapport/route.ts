import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { renderReportPdf } from "@/server/pdf/report-document";
import { pdfFileName } from "@/server/pdf/text-document";
import { progressReport, REPORT_KEY } from "@/server/services/progress-report";

/** « Télécharger le rapport (PDF) » on the progress plan (`reports.progress.detailed`). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!(await can(db, { type: "user", id: user.id }, REPORT_KEY)))
    return new NextResponse(null, { status: 403 });
  const report = await progressReport(db, user.id);
  const t = await getTranslations();
  const section = (key: "plan" | "learn" | "courses" | "profile" | "interviews" | "jobs") =>
    t(`career.plan.report.section.${key}`);
  const percent = (value: number) => t("career.plan.report.value.percent", { percent: value });
  const count = (value: number) => new Intl.NumberFormat("fr").format(value);
  const rows = [
    {
      section: section("plan"),
      name: t("career.plan.report.row.goal"),
      value: report.plan.goal ?? t("career.plan.report.value.none"),
    },
    {
      section: section("plan"),
      name: t("career.plan.report.row.steps"),
      value: t("career.plan.report.value.steps", {
        done: report.plan.done,
        total: report.plan.total,
      }),
    },
    {
      section: section("learn"),
      name: t("career.plan.report.row.enrolled"),
      value: count(report.learning.enrolled),
    },
    {
      section: section("learn"),
      name: t("career.plan.report.row.completed"),
      value: count(report.learning.completed),
    },
    {
      section: section("learn"),
      name: t("career.plan.report.row.certificates"),
      value: count(report.learning.certificates),
    },
    ...report.learning.courses.map((course) => ({
      section: section("courses"),
      name: course.title,
      value: percent(course.progress),
    })),
    {
      section: section("profile"),
      name: t("career.plan.report.row.completeness"),
      value: percent(report.profile.completeness),
    },
    {
      section: section("profile"),
      name: t("career.plan.report.row.skills"),
      value: count(report.profile.skills),
    },
    {
      section: section("profile"),
      name: t("career.plan.report.row.verified"),
      value: count(report.profile.verified),
    },
    {
      section: section("profile"),
      name: t("career.plan.report.row.cvs"),
      value: count(report.profile.cvs),
    },
    {
      section: section("profile"),
      name: t("career.plan.report.row.documents"),
      value: count(report.profile.documents),
    },
    {
      section: section("interviews"),
      name: t("career.plan.report.row.interviews"),
      value: count(report.interviews.total),
    },
    {
      section: section("interviews"),
      name: t("career.plan.report.row.recentInterviews"),
      value: count(report.interviews.recent),
    },
    ...report.interviews.latestCriteria.map((criterion) => ({
      section: section("interviews"),
      name: t("career.plan.report.row.criterion", {
        criterion: t(`career.interviews.feedback.criteria.${criterion.key}`),
      }),
      value: t(`career.interviews.feedback.level.${criterion.level}`),
    })),
    ...(
      [
        ["applications", report.applications.total],
        ["recentApplications", report.applications.recent],
        ["inProgress", report.applications.inProgress],
        ["interviewStage", report.applications.interview],
        ["hired", report.applications.hired],
      ] as const
    ).map(([key, value]) => ({
      section: section("jobs"),
      name: t(`career.plan.report.row.${key}`),
      value: count(value),
    })),
  ];
  const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(" ");
  const pdf = await renderReportPdf(
    {
      brand: t("common.brand"),
      title: t("career.plan.report.pdf.title"),
      period: t("career.plan.report.pdf.subtitle", { name, date: new Date() }),
      footer: t("career.plan.report.pdf.footer"),
    },
    rows,
  );
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(t("career.plan.report.pdf.title"), "rapport")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
