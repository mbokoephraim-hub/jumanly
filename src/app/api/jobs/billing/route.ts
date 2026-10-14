import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { paymentProvider } from "@/server/payments";
import { runBillingJobs } from "@/server/services/billing-jobs";

function authorized(request: Request) {
  const secret = process.env.JOBS_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Billing tasks, called by the host's scheduler every hour (`Authorization: Bearer JOBS_SECRET`).
 * Without JOBS_SECRET the route is closed; `pnpm jobs:billing` runs the same tasks.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  const report = await runBillingJobs(db, paymentProvider());
  return NextResponse.json(report);
}
