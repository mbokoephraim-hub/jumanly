/**
 * Test helper run with tsx: gives a fresh fictional company (made by `make-recruiter.ts`) what the
 * tab Messages of the phone shows (Modèle B recruteur M7): an offer, a fictional candidate who
 * applied and wrote, and a fictional colleague who wrote in « Équipe ».
 * `tsx tests/e2e/make-conversations.ts <organizationId> <ownerEmail>` prints the conversation's id.
 */
import { randomUUID } from "node:crypto";
import { createSeedClient } from "../../prisma/seed/client";
import { applyToJob } from "../../src/server/services/applications";
import { ensureApplicationConversation, sendMessage } from "../../src/server/services/connect";
import { openTeamThread, sendTeamMessage } from "../../src/server/services/hire-phone-messages";

const [organizationId, ownerEmail] = process.argv.slice(2);
const db = createSeedClient();
const now = new Date();

async function person(name: string) {
  const [firstName, lastName] = name.split(" ");
  return db.user.create({
    data: {
      email: `fictif-${randomUUID()}@jumanly.test`,
      name,
      firstName,
      lastName,
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      termsAcceptedAt: now,
      talentProfile: { create: { headline: "Analyste de données (fictif)" } },
    },
  });
}

async function main() {
  const owner = await db.user.findUniqueOrThrow({ where: { email: ownerEmail! } });
  const job = await db.job.create({
    data: {
      organizationId: organizationId!,
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
  const talent = await person("Grâce Fictive");
  const applied = await applyToJob(db, { userId: talent.id, jobSlug: job.slug });
  if (applied.status !== "applied") throw new Error(applied.status);
  const conversation = await ensureApplicationConversation(db, applied.applicationId);
  await sendMessage(db, { userId: talent.id }, conversation.id, {
    body: "Bonjour, je reste disponible pour un échange. (message fictif)",
  });

  const colleague = await person("Aline Fictive");
  await db.membership.create({
    data: { userId: colleague.id, organizationId: organizationId!, role: "recruiter" },
  });
  const ctx = { userId: colleague.id, organizationId: organizationId!, role: "recruiter" as const };
  const thread = await openTeamThread(db, ctx, owner.id);
  await sendTeamMessage(
    db,
    ctx,
    thread,
    "Tu peux relire l'offre d'analyste ? (fictif)",
    colleague.name,
  );
  // The bell (planches 180 to 183): today, yesterday, earlier.
  const day = 86_400_000;
  const href = `/app/hire/candidats/${applied.applicationId}`;
  await db.notification.createMany({
    data: [
      {
        userId: owner.id,
        type: "newApplication",
        payload: { candidateName: talent.name, jobTitle: job.title },
        href,
        createdAt: new Date(now.getTime() - 2 * 3_600_000),
      },
      {
        userId: owner.id,
        type: "interviewConfirmed",
        payload: { candidateName: talent.name, jobTitle: job.title },
        href,
        createdAt: new Date(now.getTime() - day),
      },
      {
        userId: owner.id,
        type: "contactAccepted",
        payload: {},
        href: "/app/hire/talents?onglet=propositions",
        createdAt: new Date(now.getTime() - 9 * day),
      },
    ],
  });
  process.stdout.write(conversation.id);
}

main().finally(() => db.$disconnect());
