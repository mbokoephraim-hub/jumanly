import { NextResponse, type NextRequest } from "next/server";
import { cvDocumentData } from "@/features/cv/document";
import { cvDocx } from "@/features/cv/export/docx";
import { cvFileName } from "@/features/cv/export/pdf";
import { splitName } from "@/features/cv/render/build";
import { cvSourceOf } from "@/features/cv/source";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";

/**
 * « Word » of « Exporter mon CV » (planche studio-cv § 3): the CV of the signed-in person on one
 * column, to edit. Same content as the PDF, no template (so no template entitlement), no photo.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/app/career/cv/[id]/word">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const document = await db.document.findFirst({
    where: { id, kind: "cv", profile: { userId: user.id } },
  });
  if (!document) return new NextResponse(null, { status: 404 });
  const source = cvSourceOf(document, null);
  const bytes = cvDocx(await cvDocumentData(source));
  const several =
    (await db.document.count({ where: { profileId: document.profileId, kind: "cv" } })) > 1;
  const { firstName, lastName } = splitName(source.content.info.name.trim());
  const name = cvFileName(
    [firstName, lastName].join(" "),
    several ? document.title : undefined,
    "docx",
  );
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
