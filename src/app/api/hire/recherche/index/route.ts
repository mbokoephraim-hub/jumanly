import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { hirePaletteIndex } from "@/server/services/hire-search";

/**
 * `Ctrl K` of the recruiter's web app v3: the latest candidates and the offers of the active
 * organization (`hirePaletteIndex`, filtered by `organizationId`), loaded when the search opens.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ candidates: [], offers: [] }, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return NextResponse.json({ candidates: [], offers: [] }, { status: 403 });
  const index = await hirePaletteIndex(db, {
    userId: user.id,
    organizationId: space.organizationId,
    role: space.role,
  });
  return NextResponse.json(index, { headers: { "Cache-Control": "private, no-store" } });
}
