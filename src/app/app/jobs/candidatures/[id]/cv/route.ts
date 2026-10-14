import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { cvLabels } from "@/server/pdf/cv-labels";
import { renderCvPdf } from "@/server/pdf/cv-document";
import { cvTemplates, parseCv, type CvTemplateId } from "@/server/services/cv";

const snapshotSchema = z.object({
  title: z.string(),
  templateId: z.string(),
  content: z.unknown(),
});

/** « Voir le CV envoyé » : the copy of the CV kept with the application. */
export async function GET(_: Request, { params }: RouteContext<"/app/jobs/candidatures/[id]/cv">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const application = await db.application.findFirst({
    where: { id, profile: { userId: user.id } },
    select: { cvSnapshot: true },
  });
  const snapshot = snapshotSchema.safeParse(application?.cvSnapshot);
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
      "Content-Disposition": `inline; filename="cv-envoye.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
