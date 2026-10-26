/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): Baobab Fintech back on its
 * seeded Company subscription, payments and invoices, after the billing test moved it to Company
 * Plus, so the other files of the company space find the plan they expect.
 * `tsx tests/e2e/reset-baobab.ts`.
 */
import { createSeedClient } from "../../prisma/seed/client";
import { seedEntrepriseBilling } from "../../prisma/seed/entreprise";

const db = createSeedClient();

seedEntrepriseBilling(db).finally(() => db.$disconnect());
