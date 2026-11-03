import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { exportCvCopy } from "@/features/cv/export/export";
import { hirePermissions } from "@/server/services/hire";
import { cvFileResponse } from "@/server/services/cv-original";
import { originalCvFile } from "@/server/services/application-cv";

export const maxDuration = 60;

/** The CV a candidate sent, for the recruiting team of the job's organization only. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/hire/candidats/[applicationId]/cv">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space || !hirePermissions(space.role).readApplications)
    return new NextResponse(null, { status: 404 });
  const { applicationId } = await params;
  const application = await db.application.findFirst({
    where: { id: applicationId, job: { organizationId: space.organizationId } },
    select: { cvSnapshot: true, profileId: true },
  });
  if (!application) return new NextResponse(null, { status: 404 });
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "cv.download",
      targetType: "talentProfile",
      targetId: application.profileId,
      organizationId: space.organizationId,
      metadata: { applicationId },
    },
  });
  // An imported CV kept as a file (PDF, photo, Word): the file itself, as the talent sent it.
  const original = await originalCvFile(application.cvSnapshot);
  if (original) return cvFileResponse(original.file, original.name, "inline");
  return exportCvCopy(
    "application",
    applicationId,
    application.cvSnapshot,
    "cv-candidat.pdf",
    request.nextUrl.origin,
  );
}
