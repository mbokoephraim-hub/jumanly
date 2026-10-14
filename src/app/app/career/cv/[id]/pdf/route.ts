import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { exportOwnCv } from "@/features/cv/export/export";

export const maxDuration = 30;

/**
 * The « PDF » link of the editor (works without JavaScript): same export as
 * POST /api/cv/[documentId]/export; a refusal goes back to the editor with its reason.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/career/cv/[id]/pdf">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const response = await exportOwnCv(user.id, id, request.nextUrl.origin);
  if (response.headers.get("Content-Type") === "application/pdf") return response;
  const { error } = (await response.json()) as { error: string };
  const back = new URL(`/app/career/cv/${id}`, request.url);
  back.searchParams.set("export", error);
  return NextResponse.redirect(back, 303);
}
