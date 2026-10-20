import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { paymentProvider } from "@/server/payments";
import { runBillingJobs } from "@/server/services/billing-jobs";
import { runDiagnosticReminders } from "@/server/services/diagnostic-store";
import { purgeScheduledDeletions } from "@/server/services/admin-users";
import { deliverDueDecisionMails } from "@/server/application-events";
import { runHireJobs } from "@/server/hire-jobs";

function matches(given: Buffer, secret: string | undefined) {
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** JOBS_SECRET for any scheduler; CRON_SECRET is the one Vercel Cron sends (vercel.json). */
function authorized(request: Request) {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return matches(given, process.env.JOBS_SECRET) || matches(given, process.env.CRON_SECRET);
}

/**
 * Billing tasks (and the « Refaire dans 30 jours » reminders of the career diagnostic), called by the host's scheduler every hour (`Authorization: Bearer JOBS_SECRET`,
 * or GET from Vercel Cron with `Bearer CRON_SECRET`). Without either secret the route is closed;
 * `pnpm jobs:billing` runs the same tasks.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  const report = await runBillingJobs(db, paymentProvider());
  const diagnosticReminders = await runDiagnosticReminders(db);
  // Account deletions asked from Paramètres, once their 30 days of grace are over (partie 10).
  const deletedAccounts = await purgeScheduledDeletions(db);
  // Recruiter lot 3: decision e-mails, once their 10 minutes to undo are over.
  const decisionMails = await deliverDueDecisionMails();
  // Recruiter lot 6: scheduled ATS analyses, end-of-offer reminders, expired join requests.
  const hire = await runHireJobs();
  return NextResponse.json({
    ...report,
    diagnosticReminders,
    deletedAccounts,
    decisionMails,
    hire,
  });
}

export const GET = POST;
