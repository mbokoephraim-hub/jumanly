import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { snapshotPdf } from "@/server/pdf/snapshot";

/** « Voir le CV envoyé » : the copy of the CV kept with the application. */
export async function GET(_: Request, { params }: RouteContext<"/app/jobs/candidatures/[id]/cv">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const application = await db.application.findFirst({
    where: { id, profile: { userId: user.id } },
    select: { cvSnapshot: true },
  });
  return snapshotPdf(application?.cvSnapshot, "cv-envoye.pdf");
}
