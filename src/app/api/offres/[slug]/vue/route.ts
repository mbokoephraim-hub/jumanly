import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { recordJobView } from "@/server/services/hire-offers";

/**
 * One view of an offer's page (« Performance » of the recruiter, planche r4): a counter per day,
 * nothing about the person who looked.
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/offres/[slug]/vue">) {
  const { slug } = await params;
  await recordJobView(db, slug.slice(0, 120)).catch(() => false);
  return new NextResponse(null, { status: 204 });
}
