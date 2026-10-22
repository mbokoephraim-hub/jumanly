/**
 * Database seed (`pnpm db:seed`).
 * Plans with their entitlement matrix, the skills reference and the places run everywhere; the obviously fictional
 * demo dataset only runs in local and preview (CLAUDE.md § 11).
 */
import { isInternalEnv } from "../../src/lib/env";
import { createSeedClient } from "./client";
import { seedAccounts } from "./accounts";
import { seedCareer } from "./career";
import { seedConnections } from "./connexions";
import { seedFeed } from "./fil";
import { seedDemo } from "./demo";
import { seedGroup } from "./group";
import { seedIntelligence } from "./intelligence";
import { seedLearnScenario } from "./apprendre";
import { seedLearnDomains, seedLearnPaths } from "./learn";
import { seedMessages } from "./messages";
import { seedPartner } from "./partners";
import { seedPlaces } from "./places";
import { seedPlans } from "./plans";
import { seedSkills } from "./skills";
import { seedSuiviScenario } from "./suivi";
import { seedUxScenario } from "./ux";

async function main() {
  const db = createSeedClient();
  try {
    await seedPlans(db);
    await seedSkills(db);
    await seedPlaces(db);
    await seedIntelligence(db);
    if (isInternalEnv()) {
      await seedDemo(db);
      await seedAccounts(db);
      await seedGroup(db);
      await seedPartner(db);
      await seedCareer(db);
      await seedUxScenario(db);
      await seedSuiviScenario(db);
      await seedLearnDomains(db);
      await seedLearnPaths(db);
      await seedLearnScenario(db);
      await seedConnections(db);
      await seedFeed(db);
      await seedMessages(db);
    } else console.log("Démo ignorée : APP_ENV n'est ni local ni preview.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
