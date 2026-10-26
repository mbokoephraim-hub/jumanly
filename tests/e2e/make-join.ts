/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): an obviously fictional
 * person who asks to join a company, still pending (lot N1, « À valider » of the home).
 * `tsx tests/e2e/make-join.ts <email> <name> <company>`.
 */
import { DEMO_PASSWORD } from "../../prisma/seed/accounts";
import { createSeedClient } from "../../prisma/seed/client";
import { hashPassword } from "better-auth/crypto";

const [email, name, company] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const now = new Date();
  const organization = await db.organization.findFirstOrThrow({
    where: { name: company! },
    select: { id: true },
  });
  const user = await db.user.create({
    data: {
      email: email!,
      name: name!,
      firstName: name!.split(" ")[0],
      lastName: "Fictive",
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      termsAcceptedAt: now,
    },
  });
  await db.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(DEMO_PASSWORD),
    },
  });
  await db.orgJoinRequest.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      matchedBy: "domain",
      message: "Demande fictive, pour un test.",
      expiresAt: new Date(now.getTime() + 6 * 86_400_000),
    },
  });
}

main().finally(() => db.$disconnect());
