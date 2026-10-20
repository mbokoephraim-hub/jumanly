import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { fileStorage } from "@/server/storage";

/**
 * « Télécharger le PDF » of a job sheet (brief recruteur § 2.6): anyone can download the sheet of
 * an offer talents can read (published, paused or closed); a draft's sheet only by its
 * organization. The file was checked when it was added (type, size, no active content).
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/offres/[slug]/fiche">) {
  const { slug } = await params;
  const job = await db.job.findUnique({
    where: { slug: slug.slice(0, 120) },
    select: { status: true, organizationId: true, jobSheetKey: true, jobSheetName: true },
  });
  if (!job?.jobSheetKey) return new NextResponse(null, { status: 404 });
  if (!["published", "paused", "closed"].includes(job.status)) {
    const user = await getCurrentUser();
    const space = user ? await getActiveSpace(user.id) : null;
    if (space?.organizationId !== job.organizationId)
      return new NextResponse(null, { status: 404 });
  }
  const file = await fileStorage(db).get(job.jobSheetKey);
  if (!file) return new NextResponse(null, { status: 404 });
  const name = (job.jobSheetName ?? "fiche-de-poste.pdf").replace(/[\r\n"]/g, "");
  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fiche-de-poste.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
