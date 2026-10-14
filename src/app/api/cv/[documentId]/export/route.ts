import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { exportOwnCv } from "@/features/cv/export/export";

/** Chromium needs time and memory (docs/modeles-cv § 6.3). */
export const maxDuration = 30;

/** « Exporter mon CV » (POST, `?format=pdf`): the PDF file, or `{ error }` with the reason. */
export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/cv/[documentId]/export">,
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "notFound" }, { status: 401 });
  const format = request.nextUrl.searchParams.get("format") ?? "pdf";
  if (format !== "pdf") return NextResponse.json({ error: "format" }, { status: 400 });
  const { documentId } = await params;
  return exportOwnCv(user.id, documentId, request.nextUrl.origin);
}
