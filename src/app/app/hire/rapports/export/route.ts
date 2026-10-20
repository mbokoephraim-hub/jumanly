import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { reportRows } from "@/server/hire-report-export";
import { renderReportPdf } from "@/server/pdf/report-document";
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
  const t = await getTranslations("hire.reports");
  const pdf = await renderReportPdf(
    {
      brand: (await getTranslations("common"))("brand"),
      title: t("pdf.title", { org: space.organization.name }),
      period: t("pdf.period", { from: range.from, to: range.to }),
      footer: [t("pdf.generated", { date: new Date() }), t("export.privacy")].join(" · "),
    },
    rows,
  );
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-${day}.pdf"`,
    },
  });
}
