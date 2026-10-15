/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): an obviously fictional
 * company waiting for its verification, with a supporting PDF in the file storage and one live
 * job, for the admin journeys of Admin v2 (étape 4). `tsx tests/e2e/make-org.ts <name>` prints the
 * organization's id.
 */
import { randomUUID } from "node:crypto";
import { createSeedClient } from "../../prisma/seed/client";
import { databaseStorage } from "../../src/server/storage";

const [name] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const slug = `test-${randomUUID()}`;
  const owner = await db.user.create({
    data: {
      email: `${slug}@jumanly.test`,
      name: "Propriétaire Fictif",
      emailVerified: true,
      termsAcceptedAt: new Date(),
    },
  });
  const organization = await db.organization.create({
    data: {
      type: "company",
      name: name ?? "Entreprise Fictive",
      slug,
      country: "CD",
      city: "Kinshasa",
      verificationStatus: "pending",
      verificationRequestedAt: new Date(),
      verificationRequest: { registration: "RCCM-FICTIF-0001", mandate: "Gérante (fictive)" },
    },
  });
  await db.membership.create({
    data: { userId: owner.id, organizationId: organization.id, role: "org_owner" },
  });
  const storageKey = `organizations/${organization.id}/${randomUUID()}`;
  const pdf = new TextEncoder().encode("%PDF-1.4\n% Justificatif fictif\n%%EOF\n");
  await databaseStorage(db as never).put(storageKey, {
    contentType: "application/pdf",
    bytes: pdf,
  });
  await db.organizationDocument.create({
    data: {
      organizationId: organization.id,
      storageKey,
      name: "registre-fictif.pdf",
      contentType: "application/pdf",
      size: pdf.byteLength,
      uploadedById: owner.id,
    },
  });
  await db.job.create({
    data: {
      organizationId: organization.id,
      title: "Poste fictif (recette admin)",
      slug: `${slug}-poste`,
      description: "Offre de test.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "Congo-Kinshasa",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
    },
  });
  process.stdout.write(organization.id);
}

main().finally(() => db.$disconnect());
