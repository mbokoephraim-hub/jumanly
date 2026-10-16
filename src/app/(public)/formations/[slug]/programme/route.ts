import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { buildCoursePdf } from "@/server/pdf/course-pdfs";
import { coursePdfFileName, loadPdfCourse, pdfResponseHeaders } from "@/server/services/course-pdf";

/** The programme of a published course as a PDF (Admin v3, étape 6): for everyone. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/formations/[slug]/programme">,
) {
  const { slug } = await params;
  const course = await loadPdfCourse(db, { slug: slug.slice(0, 120), status: "published" });
  if (!course) return new NextResponse(null, { status: 404 });
  const pdf = await buildCoursePdf(db, "programme", course);
  return new NextResponse(new Uint8Array(pdf), {
    headers: pdfResponseHeaders(coursePdfFileName("programme", course.slug)),
  });
}
