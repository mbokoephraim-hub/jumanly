/**
 * Agenda › À planifier (Ephraïm 05/11/2026): « Fixer la date » of a document check, its place in
 * the agenda and its reminder. Every reading stays inside the organization (golden rule n° 6).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { applyToJob } from "@/server/services/applications";
import { HireError, type HireContext } from "@/server/services/hire";
import { agendaTasks } from "@/server/services/hire-agenda";
import {
  planVerificationCheck,
  runVerificationCheckReminders,
} from "@/server/services/hire-verification";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function member(organizationId: string, role: MembershipRole): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

async function setup() {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  const owner = await member(organization.id, "org_owner");
  const job = await db.job.create({
    data: {
      organizationId: organization.id,
      slug: `test-${randomUUID()}`,
      title: "Analyste fictif",
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
      closesAt: new Date(Date.now() + 30 * day),
      createdById: owner.userId,
    },
  });
  const talent = await newUser();
  users.push(talent.id);
  await db.talentProfile.create({ data: { userId: talent.id, visibility: "recruiters" } });
  const result = await applyToJob(db, { userId: talent.id, jobSlug: job.slug });
  if (result.status !== "applied") throw new Error(result.status);
  await db.application.update({
    where: { id: result.applicationId },
    data: { shortlistedAt: new Date() },
  });
  await db.verificationRequest.create({
    data: {
      applicationId: result.applicationId,
      organizationId: organization.id,
      createdById: owner.userId,
      message: "Merci d'envoyer votre diplôme (test fictif).",
      dueAt: new Date(Date.now() + 5 * day),
      items: { create: [{ kind: "diploma", required: true }] },
    },
  });
  return { owner, applicationId: result.applicationId };
}

describe("Fixer la date d'une vérification", () => {
  it("dates the check, shows it in the agenda and reminds the member once", async () => {
    const { owner, applicationId } = await setup();
    const now = new Date();
    const before = await agendaTasks(db, owner, now);
    expect(before.pieces.find((item) => item.applicationId === applicationId)?.checkAt).toBeNull();

    const checkAt = new Date(now.getTime() + 30 * 60_000);
    await planVerificationCheck(db, owner, applicationId, checkAt, now);
    const after = await agendaTasks(db, owner, now);
    expect(after.pieces.find((item) => item.applicationId === applicationId)?.checkAt).toEqual(
      checkAt,
    );

    expect(await runVerificationCheckReminders(db, now)).toBeGreaterThanOrEqual(1);
    const notes = await db.notification.findMany({
      where: { userId: owner.userId, type: "verificationCheck" },
    });
    expect(notes).toHaveLength(1);
    // Once: a second run sends nothing more.
    await runVerificationCheckReminders(db, now);
    expect(
      await db.notification.count({ where: { userId: owner.userId, type: "verificationCheck" } }),
    ).toBe(1);
  });

  it("refuses a past date, another organization and a member who cannot manage", async () => {
    const { owner, applicationId } = await setup();
    const now = new Date();
    await expect(
      planVerificationCheck(db, owner, applicationId, new Date(now.getTime() - 60_000), now),
    ).rejects.toBeInstanceOf(HireError);
    const other = await setup();
    await expect(
      planVerificationCheck(db, other.owner, applicationId, new Date(now.getTime() + day), now),
    ).rejects.toBeInstanceOf(HireError);
    const viewer = await member(owner.organizationId, "viewer");
    await expect(
      planVerificationCheck(db, viewer, applicationId, new Date(now.getTime() + day), now),
    ).rejects.toBeInstanceOf(HireError);
  });
});
