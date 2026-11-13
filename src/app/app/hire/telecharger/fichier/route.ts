import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { csvText, xlsxBuffer } from "@/lib/xlsx";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { exportParams, exportQuery } from "@/server/hire-v3-export-params";
import { exportTable } from "@/server/hire-v3-export-text";
import { exportData, logDownload } from "@/server/services/hire-v3-exports";

/**
 * « Télécharger » of the web app v3: the CSV or Excel file of a document, or, for the PDF, the A4
 * document opened with the print window. Every download is noted in the log.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return new NextResponse(null, { status: 404 });
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  const url = new URL(request.url);
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const all = url.searchParams.getAll(key);
    raw[key] = key === "cols" ? all : all[0]!;
  }
  const params = exportParams(raw);
  const data = await exportData(db, ctx, params.doc, params).catch((error: Error) => {
    if (error.name === "HireError") return null;
    throw error;
  });
  if (!data) return new NextResponse(null, { status: 404 });
  await logDownload(db, ctx, params.doc, params.format, params.masked);
  if (params.format === "pdf")
    return NextResponse.redirect(
      new URL(`/app/hire/rapports/modeles?${exportQuery(params, { imprimer: "1" })}`, url),
    );
  const t = await getTranslations("hireV3Export");
  const { header, rows } = await exportTable(data, params.cols);
  const name = `jumanly-${params.doc}-${new Date().toISOString().slice(0, 10)}`;
  if (params.format === "csv")
    return new NextResponse(csvText([header, ...rows]), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${name}.csv"`,
      },
    });
  const file = xlsxBuffer(t(`docs.${params.doc}.sheet`), [header, ...rows]);
  return new NextResponse(new Blob([file as BlobPart]), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${name}.xlsx"`,
    },
  });
}
