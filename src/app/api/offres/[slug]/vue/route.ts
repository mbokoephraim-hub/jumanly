import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { recordJobView } from "@/server/services/hire-offers";

/**
 * One view of an offer's page (« Performance » of the recruiter, planche r4): a counter per day,
 * nothing about the person who looked. A signed-in talent adds one to their family of skills
 * (03/11/2026), counted, never named.
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/offres/[slug]/vue">) {
  const { slug } = await params;
  const session = await getSession().catch(() => null);
  await recordJobView(db, slug.slice(0, 120), new Date(), session?.user.id ?? null).catch(
    () => false,
  );
  return new NextResponse(null, { status: 204 });
}
