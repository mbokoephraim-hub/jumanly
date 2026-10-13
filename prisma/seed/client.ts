import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

/** Prisma client for seed scripts (outside Next.js, so without `server-only`). */
export function createSeedClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export type SeedClient = ReturnType<typeof createSeedClient>;
