/**
 * Test helper run with tsx: gives a fresh fictional company (made by `make-recruiter.ts`) what
 * Compte of the phone shows (Modèle B recruteur M8): a fictional recruiter colleague who signs in
 * with the demo password, their recruiter profile, an offer they published with one application,
 * and a post of the company they saved.
 * `tsx tests/e2e/make-team.ts <organizationId> <colleagueEmail>`.
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { DEMO_PASSWORD } from "../../prisma/seed/accounts";
import { createSeedClient } from "../../prisma/seed/client";
import { applyToJob } from "../../src/server/services/applications";

const [organizationId, colleagueEmail] = process.argv.slice(2);
const db = createSeedClient();
const now = new Date();

async function main() {
  const colleague = await db.user.create({
    data: {
      email: colleagueEmail!,
      name: "Nadine Fictive",
      firstName: "Nadine",
      lastName: "Fictive",
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      termsAcceptedAt: now,
      aiConsentAt: now,
      talentProfile: { create: {} },
      recruiterProfile: {
        create: {
          kind: "charge",
          jobTitle: "Chargée de recrutement",
          domains: ["Data", "Service client"],
          otherCities: ["Lubumbashi"],
          completedAt: now,
        },
      },
    },
  });
  await db.account.create({
    data: {
      userId: colleague.id,
      accountId: colleague.id,
      providerId: "credential",
      password: await hashPassword(DEMO_PASSWORD),
    },
  });
  await db.membership.create({
    data: {
      userId: colleague.id,
      organizationId: organizationId!,
      role: "recruiter",
      status: "active",
      jobTitle: "Chargée de recrutement",
    },
  });
  const job = await db.job.create({
    data: {
      organizationId: organizationId!,
      createdById: colleague.id,
      slug: `test-${randomUUID()}`,
      title: "Analyste de données fictif",
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "published",
      publishedAt: now,
      closesAt: new Date(now.getTime() + 30 * 86_400_000),
    },
  });
  const talent = await db.user.create({
    data: {
      email: `fictif-${randomUUID()}@jumanly.test`,
      name: "Grâce Fictive",
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      termsAcceptedAt: now,
      talentProfile: { create: { headline: "Analyste de données (fictif)" } },
    },
  });
  const applied = await applyToJob(db, { userId: talent.id, jobSlug: job.slug });
  if (applied.status !== "applied") throw new Error(applied.status);
  const post = await db.feedPost.create({
    data: {
      organizationId: organizationId!,
      body: "Journée carrière fictive à Kinshasa\nVenez rencontrer l'équipe (publication fictive).",
    },
  });
  await db.feedSave.create({ data: { postId: post.id, userId: colleague.id } });
}

main().finally(() => db.$disconnect());
