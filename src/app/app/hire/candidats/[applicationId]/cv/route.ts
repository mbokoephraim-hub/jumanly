import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { snapshotPdf } from "@/server/pdf/snapshot";
import { hirePermissions } from "@/server/services/hire";

/** The CV a candidate sent, for the recruiting team of the job's organization only. */
export async function GET(
  _: Request,
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
  return snapshotPdf(application.cvSnapshot, "cv-candidat.pdf");
}
