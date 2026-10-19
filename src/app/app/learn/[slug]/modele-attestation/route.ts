import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { specimenDrawing } from "@/server/pdf/attestation-labels";

/**
 * The specimen of a course's attestation at the talent's name (planche web talent-3 § 2-3), a light
 * drawing for the side of the course and of a path. Its number is « JMN-XXXX-XXXX »: it verifies
 * nothing and is never delivered as a document.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/app/learn/[slug]/modele-attestation">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { slug } = await params;
  const course = await db.course.findFirst({
    where: { slug: slug.slice(0, 120), status: "published", certificateEnabled: true },
    select: {
      title: true,
      durationMinutes: true,
      domain: { select: { name: true } },
      _count: { select: { modules: true } },
      skills: { take: 3, select: { skill: { select: { name: true } } } },
    },
  });
  if (!course) return new NextResponse(null, { status: 404 });
  const svg = await specimenDrawing({
    holderName: user.name,
    courseTitle: course.title,
    domain: course.domain?.name ?? null,
    hours: Math.max(1, Math.round(course.durationMinutes / 60)),
    modules: course._count.modules,
    skills: course.skills.map((item) => item.skill.name),
  });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
