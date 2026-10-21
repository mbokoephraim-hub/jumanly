import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { reportRows } from "@/server/hire-report-export";
import { renderRecruitingReport } from "@/server/pdf/recruiting-report";
import { reportPdfData } from "@/server/services/hire-report-pdf";
import { buildReport, periodRange } from "@/server/services/hire-reports";

/**
 * « Exporter en PDF » on the reports page (`reports.export`): the PDF of the chosen period. The CSV
 * was dropped by the recruiter redesign (lot 5, decision of the owner): one readable document.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return new NextResponse(null, { status: 404 });
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  const subject = { type: "organization" as const, id: ctx.organizationId };
  if (!(await can(db, subject, "reports.export"))) return new NextResponse(null, { status: 403 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const range = periodRange(params);
  const report = await buildReport(db, ctx, range).catch((error: Error) => {
    if (error.name === "HireError") return null;
    throw error;
  });
  if (!report) return new NextResponse(null, { status: 404 });
  const rows = await reportRows(report);
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "report.export",
      targetType: "organization",
      targetId: ctx.organizationId,
      organizationId: ctx.organizationId,
      metadata: { format: "pdf", period: range.period },
    },
  });
  const day = range.to.toISOString().slice(0, 10);
  const headers = { "Cache-Control": "private, no-store" };
  // The designed A4 report (recruteur lot 6, modèle rapport-recrutement): the sections already
  // drawn as charts and tables leave the detail list, and so do the members' names (« aucune
  // donnée personnelle »).
  const t = await getTranslations("hire");
  const drawn = [
    t("reports.basic.title"),
    t("reports.stats.funnel"),
    t("reports.stats.sources"),
    t("reports.stats.byJob"),
    t("reports.advanced.byRecruiter"),
    t("reports.advanced.scorecards"),
  ];
  const pdf = await renderRecruitingReport({
    org: space.organization.name,
    range,
    report,
    extra: await reportPdfData(db, ctx, range),
    rows: rows.filter((row) => !drawn.includes(row.section)),
    now: new Date(),
    // The export window of the web (lot 4) can leave out the detail by offer or Orbi's reading.
    sections: { byJob: params.offres !== "0", reading: params.lecture !== "0" },
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      // « Aperçu » of the export window opens the same PDF in a new tab instead of saving it.
      "Content-Disposition": `${params.apercu === "1" ? "inline" : "attachment"}; filename="rapport-${day}.pdf"`,
    },
  });
}
