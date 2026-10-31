import { NextResponse } from "next/server";
import { sheetDataOf } from "@/components/phone/career/letter-data";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { renderLetterPdf } from "@/server/pdf/letter-document";
import { pdfFileName, renderTextPdf } from "@/server/pdf/text-document";
import { getDocument } from "@/server/services/career-documents";
import {
  isCoverLetter,
  letterFacts,
  letterPhoto,
  letterTemplateAccess,
} from "@/server/services/letter-design";
import { parseLetterDesign } from "@/features/letter/design";

/**
 * « Télécharger en PDF »: a cover letter in its visual template (Ephraïm, 31/10/2026), another
 * text of the talent as plain paragraphs; for its owner only.
 */
export async function GET(_: Request, { params }: RouteContext<"/app/career/documents/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const document = await getDocument(db, user.id, id);
  if (!document) return new NextResponse(null, { status: 404 });
  let pdf: Uint8Array;
  if (isCoverLetter(document.data)) {
    const design = parseLetterDesign(document.style);
    const [facts, photo, access] = await Promise.all([
      letterFacts(db, user.id, document.data.jobId),
      letterPhoto(db, user.id),
      letterTemplateAccess(db, user.id),
    ]);
    // A template no longer in the plan prints in the open one; the choice stays for later.
    const template = access[design.template] ? design.template : "horizon";
    const data = await sheetDataOf(facts, document);
    pdf = await renderLetterPdf({
      data,
      design: { ...design, template },
      photo,
      title: `${data.heading} · ${data.name}`,
    });
  } else {
    pdf = await renderTextPdf({ title: document.title, text: document.data.text, footer: "" });
  }
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(document.title, "document")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
