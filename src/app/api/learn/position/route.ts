import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { LearnError } from "@/server/services/learn";
import { lessonPositionSchema, saveLessonPosition } from "@/server/services/lesson-progress";

/**
 * Position of the lesson video (Learn v2, étape 3), sent by the player while it plays and with
 * `navigator.sendBeacon` when the page is left. valider → session → droit (inscrit, formule) →
 * service. Same-origin only: the beacon carries the session cookie.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = lessonPositionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const position = await saveLessonPosition(db, user.id, parsed.data);
    return NextResponse.json({ position }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!(error instanceof LearnError)) throw error;
    return NextResponse.json({ error: error.code }, { status: 403 });
  }
}
