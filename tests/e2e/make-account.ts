/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): creates an obviously
 * fictional, verified account that an admin journey can act on without touching the shared demo
 * accounts. `tsx tests/e2e/make-account.ts <email> <name>` prints the new account's id.
 */
import { createSeedClient } from "../../prisma/seed/client";

const [email, name] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const user = await db.user.create({
    data: {
      email: email!,
      name: name ?? "Compte Fictif",
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      termsAcceptedAt: new Date(),
    },
  });
  await db.talentProfile.create({ data: { userId: user.id } });
  process.stdout.write(user.id);
}

main().finally(() => db.$disconnect());
