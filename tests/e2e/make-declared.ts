/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): an obviously fictional
 * person whose current experience names a company, without an answer from the company (étape 3,
 * A6). `tsx tests/e2e/make-declared.ts <email> <name> <company> <recruiters|anonymous>` prints the
 * slug of the company.
 */
import { DEMO_PASSWORD } from "../../prisma/seed/accounts";
import { createSeedClient } from "../../prisma/seed/client";
import { hashPassword } from "better-auth/crypto";

const [email, name, company, visibility] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const now = new Date();
  const organization = await db.organization.findFirstOrThrow({
    where: { name: company! },
    select: { slug: true },
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
  const profile = await db.talentProfile.create({
    data: { userId: user.id, visibility: visibility === "anonymous" ? "anonymous" : "recruiters" },
  });
  await db.experience.create({
    data: {
      profileId: profile.id,
      title: "Analyste fictive",
      company: company!,
      startDate: new Date(now.getTime() - 300 * 86_400_000),
      description: "Expérience fictive, pour un test.",
    },
  });
  process.stdout.write(organization.slug);
}

main().finally(() => db.$disconnect());
