import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { pdfFileName, renderTextPdf } from "@/server/pdf/text-document";
import { getDocument } from "@/server/services/career-documents";

/** « Télécharger en PDF » : a letter or a text of the talent, for its owner only. */
export async function GET(_: Request, { params }: RouteContext<"/app/career/documents/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const document = await getDocument(db, user.id, id);
  if (!document) return new NextResponse(null, { status: 404 });
  const pdf = await renderTextPdf({ title: document.title, text: document.data.text, footer: "" });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(document.title, "document")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
