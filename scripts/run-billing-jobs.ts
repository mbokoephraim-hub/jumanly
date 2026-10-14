/**
 * Billing tasks from the command line (`pnpm jobs:billing`): reminders, grace period, return to
 * the free plan, payments without answer. For a cron job on the host; safe to run often.
 */
import { createSeedClient } from "../prisma/seed/client";
import { paymentProvider } from "../src/server/payments";
import { runBillingJobs } from "../src/server/services/billing-jobs";

async function main() {
  const db = createSeedClient();
  try {
    const report = await runBillingJobs(db, paymentProvider());
    console.log(JSON.stringify(report));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
