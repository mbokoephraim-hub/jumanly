/**
 * Database seed (`pnpm db:seed`).
 * Plans with their entitlement matrix and the skills reference run everywhere; the obviously fictional
 * demo dataset only runs in local and preview (CLAUDE.md § 11).
 */
import { isInternalEnv } from "../../src/lib/env";
import { createSeedClient } from "./client";
import { seedAccounts } from "./accounts";
import { seedDemo } from "./demo";
import { seedGroup } from "./group";
import { seedIntelligence } from "./intelligence";
import { seedPartner } from "./partners";
import { seedPlans } from "./plans";
import { seedSkills } from "./skills";

async function main() {
  const db = createSeedClient();
  try {
    await seedPlans(db);
    await seedSkills(db);
    await seedIntelligence(db);
    if (isInternalEnv()) {
      await seedDemo(db);
      await seedAccounts(db);
      await seedGroup(db);
      await seedPartner(db);
    } else console.log("Démo ignorée : APP_ENV n'est ni local ni preview.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
