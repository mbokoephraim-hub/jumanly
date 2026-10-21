import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { hireSearchPreview } from "@/server/services/hire-search";

const querySchema = z.string().trim().min(2).max(100);

/**
 * `Ctrl K` of the recruiter's web frame: the candidates and offers of the active organization that
 * match the words (`hireSearchPreview`, filtered by `organizationId`). Nothing outside a space.
 */
export async function GET(request: Request) {
  const parsed = querySchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  if (!parsed.success) return NextResponse.json({ items: [] });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return NextResponse.json({ items: [] }, { status: 403 });
  const items = await hireSearchPreview(
    db,
    { userId: user.id, organizationId: space.organizationId, role: space.role },
    parsed.data,
  );
  return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}
