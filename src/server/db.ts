import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Une seule instance en développement, malgré le rechargement à chaud.
const globalPourPrisma = globalThis as unknown as { prisma?: PrismaClient };

function creerClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalPourPrisma.prisma ?? creerClient();

if (process.env.NODE_ENV !== "production") globalPourPrisma.prisma = db;
