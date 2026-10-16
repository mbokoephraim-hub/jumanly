import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { buildCoursePdf } from "@/server/pdf/course-pdfs";
import { documentViewer, visibleDocuments } from "@/server/services/course-documents";
import { coursePdfFileName, loadPdfCourse, pdfResponseHeaders } from "@/server/services/course-pdf";

/**
 * The full course support as a PDF (Admin v3, étape 6): for a talent enrolled in a published
 * course that their plan opens, like the lessons themselves. It lists only the documents they may
 * download.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/app/learn/[slug]/support">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { slug } = await params;
  const course = await loadPdfCourse(db, { slug: slug.slice(0, 120), status: "published" });
  if (!course) return new NextResponse(null, { status: 404 });
  const viewer = await documentViewer(db, user, course);
  if (!viewer || !(viewer.team || (viewer.enrolled && viewer.levelOpens)))
    return new NextResponse(null, { status: 404 });
  const documents = await visibleDocuments(db, course, viewer);
  const pdf = await buildCoursePdf(db, "support", course, {
    documents: documents.map((document) => document.title),
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: pdfResponseHeaders(coursePdfFileName("support", course.slug)),
  });
}
