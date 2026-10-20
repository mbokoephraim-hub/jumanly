/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): an obviously fictional
 * recruiter who owns a fresh company (Free, no offer yet), signing in with the demo password, so
 * a journey can publish without using the places of the shared demo organizations.
 * `tsx tests/e2e/make-recruiter.ts <email> <organization> [unverified]` prints the organization's
 * id.
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { DEMO_PASSWORD } from "../../prisma/seed/accounts";
import { createSeedClient } from "../../prisma/seed/client";

const [email, name, state] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const now = new Date();
  const user = await db.user.create({
    data: {
      email: email!,
      name: "Recruteuse Fictive",
      firstName: "Recruteuse",
      lastName: "Fictive",
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      termsAcceptedAt: now,
      aiConsentAt: now,
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
  await db.talentProfile.create({ data: { userId: user.id } });
  const organization = await db.organization.create({
    data: {
      type: "company",
      name: name ?? "Entreprise Fictive",
      slug: `test-${randomUUID()}`,
      country: "CD",
      city: "Kinshasa",
      ...(state === "unverified" ? {} : { verifiedAt: now, verificationStatus: "verified" }),
    },
  });
  await db.membership.create({
    data: { userId: user.id, organizationId: organization.id, role: "org_owner", status: "active" },
  });
  process.stdout.write(organization.id);
}

main().finally(() => db.$disconnect());
