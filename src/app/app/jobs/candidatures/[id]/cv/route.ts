import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { exportCvCopy } from "@/features/cv/export/export";

export const maxDuration = 30;

/** « Voir le CV envoyé » : the copy of the CV kept with the application. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/jobs/candidatures/[id]/cv">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const application = await db.application.findFirst({
    where: { id, profile: { userId: user.id } },
    select: { cvSnapshot: true },
  });
  if (!application) return new NextResponse(null, { status: 404 });
  return exportCvCopy(
    "application",
    id,
    application.cvSnapshot,
    "cv-envoye.pdf",
    request.nextUrl.origin,
  );
}
