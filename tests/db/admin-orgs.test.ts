import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  addVerificationDocuments,
  openDocument,
  OrgAdminError,
  organizationDetail,
  reactivateOrganization,
  removeVerificationDocument,
  requestMoreInformation,
  suspendOrganization,
} from "@/server/services/admin-orgs";
import { fakeStorage } from "@/server/storage";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const storage = fakeStorage();
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
const DAY = 86_400_000;

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.application.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.pipelineStage.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function ownedOrganization() {
  const owner = await newUser();
  users.push(owner.id);
  const org = await newOrganization("company");
  orgs.push(org.id);
  await db.membership.create({
    data: { userId: owner.id, organizationId: org.id, role: "org_owner" },
  });
  return {
    owner,
    org,
    ctx: { userId: owner.id, organizationId: org.id, role: "org_owner" as const },
  };
}

async function job(organizationId: string, closesAt: Date | null = null) {
  return db.job.create({
    data: {
      organizationId,
      title: "Poste fictif",
      slug: `test-${randomUUID()}`,
      description: "Offre de test.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "Congo-Kinshasa",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
      closesAt,
    },
  });
}

describe("justificatifs de vérification (Admin v2, étape 4)", () => {
  it("garde un PDF, refuse un faux type et trace chaque ouverture", async () => {
    const { org, ctx } = await ownedOrganization();
    const [document] = await addVerificationDocuments(db, storage, ctx, [
      { name: "registre/commerce?.pdf", bytes: PDF },
    ]);
    expect(document?.contentType).toBe("application/pdf");
    expect(document?.name).toBe("registre-commerce-.pdf");

    await expect(
      addVerificationDocuments(db, storage, ctx, [
        { name: "faux.pdf", bytes: new TextEncoder().encode("<html>bonjour</html>") },
      ]),
    ).rejects.toThrow(OrgAdminError);
    await expect(
      addVerificationDocuments(db, storage, ctx, [
        { name: "gros.pdf", bytes: new Uint8Array(5 * 1024 * 1024).fill(0x25) },
      ]),
    ).rejects.toThrow(OrgAdminError);
    // A recruiter of the organization cannot send them.
    await expect(
      addVerificationDocuments(db, storage, { ...ctx, role: "recruiter" }, [
        { name: "a.pdf", bytes: PDF },
      ]),
    ).rejects.toThrow(OrgAdminError);

    const admin = await newUser();
    users.push(admin.id);
    const opened = await openDocument(db, storage, { actorId: admin.id }, document!.id);
    expect(opened?.object.bytes).toEqual(PDF);
    expect(
      await db.auditLog.count({ where: { targetId: org.id, action: "org.document.view" } }),
    ).toBe(1);
    expect((await organizationDetail(db, org.id)).documents).toHaveLength(1);

    await removeVerificationDocument(db, storage, ctx, document!.id);
    expect(await storage.get(document!.storageKey)).toBeNull();
  });

  it("demande un complément sur une demande en attente seulement", async () => {
    const { owner, org } = await ownedOrganization();
    const admin = await newUser();
    users.push(admin.id);
    await expect(
      requestMoreInformation(
        db,
        { actorId: admin.id },
        {
          organizationId: org.id,
          reason: "Registre lisible",
        },
      ),
    ).rejects.toThrow(OrgAdminError);
    await db.organization.update({
      where: { id: org.id },
      data: { verificationStatus: "pending" },
    });
    await requestMoreInformation(
      db,
      { actorId: admin.id },
      {
        organizationId: org.id,
        reason: "Registre du commerce lisible, s'il vous plaît",
      },
    );
    const after = await db.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(after.verificationStatus).toBe("info_requested");
    expect(after.verificationReason).toContain("Registre");
    expect(
      await db.notification.count({ where: { userId: owner.id, type: "orgVerificationInfo" } }),
    ).toBe(1);
  });
});

describe("suspension d'une organisation", () => {
  it("ferme ses offres, prévient les candidats, puis les republie à la réactivation", async () => {
    const { owner, org } = await ownedOrganization();
    const admin = await newUser();
    users.push(admin.id);
    const open = await job(org.id);
    const expired = await job(org.id, new Date(Date.now() + DAY));
    const talent = await newUser();
    users.push(talent.id);
    const profile = await db.talentProfile.create({ data: { userId: talent.id } });
    const stage = await db.pipelineStage.create({
      data: { jobId: open.id, name: "Reçue", order: 0, kind: "new" },
    });
    await db.application.create({
      data: { jobId: open.id, profileId: profile.id, stageId: stage.id },
    });

    const now = new Date();
    const result = await suspendOrganization(
      db,
      { actorId: admin.id },
      {
        organizationId: org.id,
        reason: "Offres trompeuses (fictif)",
      },
      now,
    );
    expect(result.jobs).toBe(2);
    const suspended = await db.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(suspended.suspendedAt).not.toBeNull();
    expect((await db.job.findUniqueOrThrow({ where: { id: open.id } })).status).toBe("closed");
    expect(
      await db.notification.count({ where: { userId: talent.id, type: "jobUnavailable" } }),
    ).toBe(1);
    expect(await db.notification.count({ where: { userId: owner.id, type: "orgSuspended" } })).toBe(
      1,
    );
    // The talent keeps the application.
    expect(await db.application.count({ where: { profileId: profile.id } })).toBe(1);
    await expect(
      suspendOrganization(db, { actorId: admin.id }, { organizationId: org.id, reason: "Encore" }),
    ).rejects.toThrow(OrgAdminError);

    // Two days later: the job whose deadline passed stays closed.
    const later = new Date(now.getTime() + 2 * DAY);
    const back = await reactivateOrganization(
      db,
      { actorId: admin.id },
      {
        organizationId: org.id,
        reason: "",
      },
      later,
    );
    expect(back.jobs).toBe(1);
    expect((await db.job.findUniqueOrThrow({ where: { id: open.id } })).status).toBe("published");
    expect((await db.job.findUniqueOrThrow({ where: { id: expired.id } })).status).toBe("closed");
    expect(
      (await db.organization.findUniqueOrThrow({ where: { id: org.id } })).suspendedAt,
    ).toBeNull();
  });
});
