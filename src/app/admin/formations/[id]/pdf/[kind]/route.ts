import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { buildCoursePdf } from "@/server/pdf/course-pdfs";
import {
  coursePdfFileName,
  isCoursePdfKind,
  loadPdfCourse,
  pdfResponseHeaders,
  reportDays,
} from "@/server/services/course-pdf";

/**
 * The PDFs of a course for the course team (Admin v3, étape 6): programme and support of any
 * course, even a draft, the quiz with its answer key, the attestation preview and the report
 * (`?periode=30|90|365`). Each download is written in the audit log.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/admin/formations/[id]/pdf/[kind]">,
) {
  const user = await requireCourseEditor();
  if (!user) return new NextResponse(null, { status: 404 });
  const { id, kind } = await params;
  if (!isCoursePdfKind(kind)) return new NextResponse(null, { status: 404 });
  const course = await loadPdfCourse(db, { id: id.slice(0, 60) });
  if (!course) return new NextResponse(null, { status: 404 });
  const days = reportDays(new URL(request.url).searchParams.get("periode"));
  const documents =
    kind === "support"
      ? await db.courseDocument.findMany({
          where: { courseId: course.id, visibility: { not: "team" } },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          select: { title: true },
        })
      : [];
  const pdf = await buildCoursePdf(db, kind, course, {
    days,
    documents: documents.map((document) => document.title),
  });
  const requestHeaders = await headers();
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "course.pdf.download",
      targetType: "course",
      targetId: course.id,
      metadata: { kind, ...(kind === "bilan" ? { days } : {}) },
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: pdfResponseHeaders(coursePdfFileName(kind, course.slug)),
  });
}
