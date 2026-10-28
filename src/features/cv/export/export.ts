import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { canUseTemplate } from "@/server/services/cv";
import { cvFileResponse } from "@/server/services/cv-original";
import { fileStorage } from "@/server/storage";
import { MAX_PAGES } from "../style";
import { splitName } from "../render/build";
import { parseCv } from "@/server/services/cv";
import { templateOf } from "../templates/registry";
import { cvFileName, CvExportError, printCvPdf } from "./pdf";
import { createPrintToken, type PrintSource } from "./token";

export type CvExportFailure = "notFound" | "locked" | "overMax" | "failed";

/** Address of the print page, on the server that received the request. */
function printUrl(origin: string, source: PrintSource, id: string) {
  const base = process.env.CV_PRINT_ORIGIN || origin;
  const token = createPrintToken(source, id);
  return `${base}/impression/cv/${encodeURIComponent(id)}?jeton=${encodeURIComponent(token)}`;
}

function pdfResponse(bytes: Uint8Array, fileName: string, disposition: "attachment" | "inline") {
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function failure(reason: CvExportFailure, status: number) {
  return NextResponse.json({ error: reason }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * « Télécharger » a CV of the signed-in person (§ 6.3): ownership and the entitlement
 * `career.cv.templates.access` are checked BEFORE any rendering; above the page limit the export
 * is refused (§ 4.7).
 */
export async function exportOwnCv(userId: string, documentId: string, origin: string) {
  const document = await db.document.findFirst({
    where: { id: documentId, kind: "cv", profile: { userId } },
  });
  if (!document) return failure("notFound", 404);
  const template = templateOf(document.templateId);
  if (!(await canUseTemplate(db, { type: "user", id: userId }, template))) {
    return failure("locked", 403);
  }
  const name = parseCv(document.content).info.name.trim();
  try {
    const pdf = await printCvPdf({ url: printUrl(origin, "document", document.id), name });
    if (pdf.pages > MAX_PAGES) return failure("overMax", 409);
    await db.document.update({
      where: { id: document.id },
      data: { pageCount: pdf.pages, updatedAt: document.updatedAt },
    });
    const several =
      (await db.document.count({ where: { profileId: document.profileId, kind: "cv" } })) > 1;
    const { firstName, lastName } = splitName(name);
    return pdfResponse(
      pdf.bytes,
      cvFileName([firstName, lastName].join(" "), several ? document.title : undefined),
      "attachment",
    );
  } catch (error) {
    if (!(error instanceof CvExportError)) console.error(error);
    return failure("failed", 500);
  }
}

/**
 * A copy kept with an application or a message: printed as it was sent, whatever the current
 * plan (a CV already sent never changes).
 */
export async function exportCvCopy(
  source: Exclude<PrintSource, "document">,
  id: string,
  snapshot: unknown,
  fileName: string,
  origin: string,
) {
  // An imported CV kept as a file is sent as that file (Ephraïm, 27/10).
  const file = (snapshot as { file?: { key?: string; name?: string } } | null)?.file;
  const stored = file?.key ? await fileStorage(db).get(file.key) : null;
  if (stored) return cvFileResponse(stored, file?.name || fileName, "inline");
  const content = (snapshot as { content?: unknown } | null)?.content;
  if (!content) return new NextResponse(null, { status: 404 });
  const name = parseCv(content as never).info.name.trim();
  try {
    const pdf = await printCvPdf({ url: printUrl(origin, source, id), name });
    return pdfResponse(pdf.bytes, fileName, "inline");
  } catch (error) {
    if (!(error instanceof CvExportError)) console.error(error);
    return new NextResponse(null, { status: 500 });
  }
}
