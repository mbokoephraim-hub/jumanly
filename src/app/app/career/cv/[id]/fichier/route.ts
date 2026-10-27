import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { cvFileResponse } from "@/server/services/cv-original";
import { fileStorage } from "@/server/storage";

/**
 * The file of an imported CV kept in « Mes CV » (Ephraïm, 27/10), for its owner only: read in
 * the app (`inline`), or saved as it was imported (`?telecharger=1`).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/career/cv/[id]/fichier">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const cv = await db.document.findFirst({
    where: { id: id.slice(0, 60), kind: "cv", profile: { userId: user.id } },
    select: { fileKey: true, fileName: true, title: true },
  });
  const file = cv?.fileKey ? await fileStorage(db).get(cv.fileKey) : null;
  if (!cv || !file) return new NextResponse(null, { status: 404 });
  return cvFileResponse(
    file,
    cv.fileName ?? cv.title,
    request.nextUrl.searchParams.has("telecharger") ? "attachment" : "inline",
  );
}
