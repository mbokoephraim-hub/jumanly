import { NextResponse } from "next/server";
import { z } from "zod";
import { cvLabels } from "@/server/pdf/cv-labels";
import { renderCvPdf } from "@/server/pdf/cv-document";
import { cvTemplates, parseCv, type CvTemplateId } from "@/server/services/cv";

const snapshotSchema = z.object({
  title: z.string(),
  templateId: z.string(),
  content: z.unknown(),
});

/**
 * PDF of a CV copy kept with an application or a message: later edits of the CV do not change
 * what was sent. 404 when there is no valid copy.
 */
export async function snapshotPdf(value: unknown, filename: string) {
  const snapshot = snapshotSchema.safeParse(value);
  if (!snapshot.success) return new NextResponse(null, { status: 404 });
  const templateId = (cvTemplates.find((template) => template.id === snapshot.data.templateId)
    ?.id ?? "classic") as CvTemplateId;
  const pdf = await renderCvPdf({
    content: parseCv(snapshot.data.content as never),
    templateId,
    labels: await cvLabels(snapshot.data.title),
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
