import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { newPostsSince } from "@/server/services/feed";

const query = z.object({ depuis: z.iso.datetime() });

/**
 * « Nouvelles publications » of the Fil: how many posts others published since the Fil was
 * shown. The Fil asks every minute while it shows; read only.
 */
export async function GET(request: NextRequest) {
  const parsed = query.safeParse({ depuis: request.nextUrl.searchParams.get("depuis") });
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const count = await newPostsSince(db, user.id, new Date(parsed.data.depuis));
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
