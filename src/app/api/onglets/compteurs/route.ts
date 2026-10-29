import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { recruiterTabCounts, talentTabCounts } from "@/server/services/tab-counts";

const when = z.iso.datetime().optional();
const query = z.object({ fil: when, explorer: when, carriere: when });

/**
 * The counts of the phone's menu: the menu asks every minute while the app is in front, with the
 * last visit of each tab the phone remembers. Read only.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsed = query.safeParse({
    fil: params.get("fil") ?? undefined,
    explorer: params.get("explorer") ?? undefined,
    carriere: params.get("carriere") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const date = (value?: string) => (value ? new Date(value) : undefined);
  const seen = {
    fil: date(parsed.data.fil),
    explorer: date(parsed.data.explorer),
    carriere: date(parsed.data.carriere),
  };
  const space = await getActiveSpace(user.id);
  const counts = space
    ? await recruiterTabCounts(
        db,
        { userId: user.id, organizationId: space.organizationId, role: space.role },
        seen,
      )
    : await talentTabCounts(db, user.id, seen);
  return NextResponse.json(counts, { headers: { "Cache-Control": "no-store" } });
}
