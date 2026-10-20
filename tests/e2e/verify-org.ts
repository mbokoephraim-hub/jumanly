/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): the organizations of an
 * e2e account become verified by Jumanly, as an administrator would do it, so that their offers
 * publish at once (brief recruteur § 2.11). `tsx tests/e2e/verify-org.ts <email>`.
 */
import { createSeedClient } from "../../prisma/seed/client";

const [email] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  if (!email) throw new Error("e-mail manquant");
  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  const memberships = await db.membership.findMany({ where: { userId: user.id } });
  await db.organization.updateMany({
    where: { id: { in: memberships.map((membership) => membership.organizationId) } },
    data: { verifiedAt: new Date(), verificationStatus: "verified" },
  });
}

main().finally(() => db.$disconnect());
