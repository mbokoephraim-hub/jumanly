import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { documentFileName, openCourseDocument } from "@/server/services/course-documents";
import { fileStorage } from "@/server/storage";

/**
 * Download of a PDF document of a course (Admin v3, étape 5): `documentAccess` decides (public
 * document or preview lesson, enrolled talent whose plan opens the course, specialized right, the
 * team); otherwise a plain 404. Each download is counted.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/formations/documents/[id]">,
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const found = await openCourseDocument(db, fileStorage(db), user, id.slice(0, 60));
  if (!found) return new NextResponse(null, { status: 404 });
  const { document, object } = found;
  const name = documentFileName(document.title);
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
