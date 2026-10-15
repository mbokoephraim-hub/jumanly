import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { dynamic } from "@/i18n/dynamic";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { renderReportPdf } from "@/server/pdf/report-document";
import { pdfFileName } from "@/server/pdf/text-document";
import { parseDiagnosticV2, parsePersonalized } from "@/server/services/diagnostic";
import { bandFor } from "@/server/services/diagnostic-scoring";

/**
 * « Télécharger le bilan (PDF) » (docs/experience-animee § 5.5): the global level, the six
 * dimensions with their finding, the priorities and, for the personalized level, the summary.
 * Only the talent's own diagnostic; never shown to recruiters.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const id = new URL(request.url).searchParams.get("bilan") ?? "";
  const diagnostic = await db.careerDiagnostic.findFirst({ where: { id, userId: user.id } });
  const result = diagnostic ? parseDiagnosticV2(diagnostic.result) : null;
  if (!diagnostic || !result) return new NextResponse(null, { status: 404 });
  const personal =
    diagnostic.level === "personalized" ? parsePersonalized(diagnostic.result) : null;

  const t = await getTranslations();
  const d = dynamic(await getTranslations("career.diagnostic"));
  const section = {
    global: d("pdf.global"),
    dimensions: d("pdf.dimensions"),
    priorities: d("pdf.priorities"),
    summary: d("pdf.summary"),
  };
  const rows = [
    {
      section: section.global,
      name: d(`stage.${result.stage}`),
      value: d("result.score", { score: result.score }),
    },
    ...result.dimensions.flatMap((item) => [
      {
        section: section.dimensions,
        name: d(`dimension.${item.key}.name`),
        value: d("dimension.score", { score: item.score }),
      },
      {
        section: section.dimensions,
        name: d(`dimension.${item.key}.finding.${bandFor(item.score)}`),
        value: "",
      },
    ]),
    ...result.priorities.map((key, index) => ({
      section: section.priorities,
      name: `${index + 1}. ${d(`rule.priority.${key}`)}`,
      value: "",
    })),
    ...(personal?.summary ? [{ section: section.summary, name: personal.summary, value: "" }] : []),
  ];
  const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(" ");
  const title = d("pdf.title");
  const pdf = await renderReportPdf(
    {
      brand: t("common.brand"),
      title,
      period: d("pdf.subtitle", { name, date: diagnostic.createdAt }),
      footer: d("pdf.footer"),
    },
    rows,
  );
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(title, "bilan")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
