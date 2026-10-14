import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPartnerSpace } from "@/server/partner-context";
import { partnerReportRows } from "@/server/partner-report-export";
import { renderReportPdf } from "@/server/pdf/report-document";
import { partnerMemberships } from "@/server/services/organization";
import { impactReport, PartnerError } from "@/server/services/partners";
import { periodRange } from "@/server/services/hire-reports";

/** « Exporter en PDF » on the impact reports page: the same aggregated cells, nothing more. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const membership =
    (await getPartnerSpace(user.id)) ?? (await partnerMemberships(db, user.id))[0] ?? null;
  if (!membership) return new NextResponse(null, { status: 404 });
  const ctx = { userId: user.id, organizationId: membership.organizationId };
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const range = periodRange(params);
  const batchId = params.lot?.slice(0, 60) || undefined;
  const report = await impactReport(db, ctx, { batchId, from: range.from, to: range.to }).catch(
    (error: Error) => {
      if (error instanceof PartnerError) return null;
      throw error;
    },
  );
  if (!report) return new NextResponse(null, { status: 404 });
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "partner.report.export",
      targetType: "organization",
      targetId: ctx.organizationId,
      organizationId: ctx.organizationId,
      metadata: { period: range.period, batchId: batchId ?? null },
    },
  });
  const t = await getTranslations();
  const pdf = await renderReportPdf(
    {
      brand: t("common.brand"),
      title: t("partner.reports.pdf.title", { org: membership.organization.name }),
      period: t("hire.reports.pdf.period", { from: range.from, to: range.to }),
      footer: [
        t("partner.reports.export.footer", { date: new Date() }),
        t("partner.reports.privacy.threshold", { minGroup: report.minGroup }),
      ].join(" · "),
    },
    await partnerReportRows(report),
  );
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-impact-${range.to.toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
