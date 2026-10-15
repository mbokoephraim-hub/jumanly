/**
 * Billing tasks from the command line (`pnpm jobs:billing`): reminders, grace period, return to
 * the free plan, payments without answer. For a cron job on the host; safe to run often.
 */
import { createSeedClient } from "../prisma/seed/client";
import { paymentProvider } from "../src/server/payments";
import { runBillingJobs } from "../src/server/services/billing-jobs";
import { runDiagnosticReminders } from "../src/server/services/diagnostic-store";
import { purgeScheduledDeletions } from "../src/server/services/admin-users";

async function main() {
  const db = createSeedClient();
  try {
    const report = await runBillingJobs(db, paymentProvider());
    const diagnosticReminders = await runDiagnosticReminders(db);
    const deletedAccounts = await purgeScheduledDeletions(db);
    console.log(JSON.stringify({ ...report, diagnosticReminders, deletedAccounts }));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
