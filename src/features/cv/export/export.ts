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
import { cvFileName, printCvPdf, withMetadata } from "./pdf";
import { cvTextLabels } from "../labels";
import { documentFromCv } from "../render/build";
import { accentHex } from "../render/palette";
import { loadCvSource } from "../source";
import { renderSimpleCv } from "@/server/pdf/cv-simple";
import { photoByToken } from "@/server/services/profile-photo";
import { createPrintToken, type PrintSource } from "./token";

/** Chromium gets this long; past it, the CV is drawn without it (the function stops at 60 s). */
const PRINT_DEADLINE_MS = 35_000;

function printInTime(args: Parameters<typeof printCvPdf>[0]) {
  return Promise.race([
    printCvPdf(args),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Impression trop longue.")), PRINT_DEADLINE_MS),
    ),
  ]);
}

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

/**
 * The CV drawn without a browser (src/server/pdf/cv-simple.tsx), when Chromium fails: the person
 * always gets a PDF (Ephraïm, 31/10/2026). Null when even that cannot be drawn.
 */
async function drawnCv(source: PrintSource, id: string, name: string) {
  try {
    const cv = await loadCvSource(db, source, id);
    if (!cv) return null;
    const labels = await cvTextLabels(cv.style.titlesLanguage);
    const data = documentFromCv(cv.content, labels, cv.photoUrl);
    let photo: Buffer | null = null;
    const token = data.photoUrl?.startsWith("/api/photo/") ? data.photoUrl.slice(11) : null;
    if (token) {
      const stored = await photoByToken(db, token);
      if (stored && /^image\/(jpeg|png)$/.test(stored.contentType))
        photo = Buffer.from(stored.bytes);
    }
    const pdf = await renderSimpleCv({
      data,
      accent: accentHex(cv.style.accent) ?? "#14745F",
      photo,
      title: name ? `CV ${name}` : "CV",
    });
    return withMetadata(new Uint8Array(pdf), name);
  } catch (error) {
    console.error("[cv-pdf] le CV dessiné sans navigateur a échoué", error);
    return null;
  }
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
    const pdf = await printInTime({ url: printUrl(origin, "document", document.id), name });
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
    console.error("[cv-pdf] impression du modèle impossible, CV dessiné à la place", error);
    const drawn = await drawnCv("document", document.id, name);
    if (!drawn) return failure("failed", 500);
    const { firstName, lastName } = splitName(name);
    return pdfResponse(drawn, cvFileName([firstName, lastName].join(" ")), "attachment");
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
    const pdf = await printInTime({ url: printUrl(origin, source, id), name });
    return pdfResponse(pdf.bytes, fileName, "inline");
  } catch (error) {
    console.error("[cv-pdf] impression du modèle impossible, CV dessiné à la place", error);
    const drawn = await drawnCv(source, id, name);
    if (!drawn) return new NextResponse(null, { status: 500 });
    return pdfResponse(drawn, fileName, "inline");
  }
}
