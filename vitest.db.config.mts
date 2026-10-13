import { defineConfig } from "vitest/config";

/**
 * Rules that live in the database (entitlements, subscriptions), tested against PostgreSQL with the
 * seeded plans: `pnpm db:deploy && pnpm db:seed` first.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
