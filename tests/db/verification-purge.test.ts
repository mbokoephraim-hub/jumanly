/**
 * Pieces erased 90 days after the end of the offer (évaluation recruteur, 06/11/2026).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { ensureStages } from "@/server/services/applications";
import { purgeEndedVerificationPieces } from "@/server/services/hire-verification";
import { databaseStorage } from "@/server/storage";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const DAY = 86_400_000;

afterAll(async () => {
  await db.application.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function pieceFor(closesAt: Date) {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  const recruiter = await newUser();
  const talent = await newUser();
  users.push(recruiter.id, talent.id);
  const job = await db.job.create({
    data: {
      organizationId: organization.id,
      slug: `test-${randomUUID()}`,
      title: "Comptable fictif",
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(closesAt.getTime() - 30 * DAY),
      closesAt,
      createdById: recruiter.id,
    },
  });
  const profile = await db.talentProfile.create({ data: { userId: talent.id } });
  const [stage] = await ensureStages(db, job.id);
  const application = await db.application.create({
    data: { jobId: job.id, profileId: profile.id, stageId: stage!.id },
  });
  const storage = databaseStorage(db);
  const key = `verification/test/${randomUUID()}`;
  await storage.put(key, {
    contentType: "application/pdf",
    bytes: new Uint8Array([37, 80, 68, 70]),
  });
  const request = await db.verificationRequest.create({
    data: {
      applicationId: application.id,
      organizationId: organization.id,
      message: "Merci d'envoyer vos pièces.",
      dueAt: closesAt,
      items: {
        create: [
          { kind: "diploma", fileKey: key, fileName: "diplome.pdf", receivedAt: closesAt },
          {
            kind: "referent",
            referentName: "Référent Fictif",
            referentEmail: "referent@jumanly.test",
            receivedAt: closesAt,
          },
        ],
      },
    },
    include: { items: true },
  });
  return { request, key, storage };
}

describe("effacement des pièces après la fin de l'offre", () => {
  it("efface fichiers et contacts 90 jours après, garde la trace de réception", async () => {
    const now = new Date();
    const old = await pieceFor(new Date(now.getTime() - 91 * DAY));
    const recent = await pieceFor(new Date(now.getTime() - 10 * DAY));

    await purgeEndedVerificationPieces(db, old.storage, now);

    const oldItems = await db.verificationItem.findMany({ where: { requestId: old.request.id } });
    expect(oldItems.every((item) => !item.fileKey && !item.referentEmail)).toBe(true);
    expect(oldItems.every((item) => item.receivedAt !== null)).toBe(true);
    expect(await old.storage.get(old.key)).toBeNull();

    const recentItems = await db.verificationItem.findMany({
      where: { requestId: recent.request.id },
    });
    expect(recentItems.some((item) => item.fileKey === recent.key)).toBe(true);
    expect(await recent.storage.get(recent.key)).not.toBeNull();
  });
});
