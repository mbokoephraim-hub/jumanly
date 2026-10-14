import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { cvLabels } from "@/server/pdf/cv-labels";
import { renderCvPdf } from "@/server/pdf/cv-document";
import { cvTemplates, parseCv, type CvTemplateId } from "@/server/services/cv";

/** « Exporter mon CV » : the CV as a PDF file, for its owner only. */
export async function GET(_: Request, { params }: RouteContext<"/app/career/cv/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const cv = await db.document.findFirst({
    where: { id, kind: "cv", profile: { userId: user.id } },
  });
  if (!cv) return new NextResponse(null, { status: 404 });
  const templateId = (cvTemplates.find((template) => template.id === cv.templateId)?.id ??
    "classic") as CvTemplateId;
  const pdf = await renderCvPdf({
    content: parseCv(cv.content),
    templateId,
    labels: await cvLabels(cv.title),
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName(cv.title)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function fileName(title: string) {
  return (
    title
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "cv"
  );
}
