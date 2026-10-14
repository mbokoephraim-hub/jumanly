import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate } from "@/server/entitlements";
import {
  applyToJob,
  listApplications,
  talentStatus,
  withdrawApplication,
} from "@/server/services/applications";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const jobs: string[] = [];

afterAll(async () => {
  await db.application.deleteMany({ where: { jobId: { in: jobs } } });
  await db.pipelineStage.deleteMany({ where: { jobId: { in: jobs } } });
  await db.job.deleteMany({ where: { id: { in: jobs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function newJob(closesAt: Date | null = new Date(Date.now() + 7 * 86_400_000)) {
  const org = await newOrganization("company");
  orgs.push(org.id);
  const job = await db.job.create({
    data: {
      organizationId: org.id,
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
  jobs.push(job.id);
  return job;
}

async function talent() {
  const user = await newUser();
  users.push(user.id);
  return user;
}

describe("candidater est toujours gratuit (règle d'or n° 1)", () => {
  it("quel que soit le forfait talent (tous ceux de la base)", async () => {
    const plans = await db.plan.findMany({ where: { family: "talent" } });
    expect(plans.length).toBeGreaterThan(0);
    for (const plan of plans) {
      const user = await talent();
      const now = new Date();
      await db.subscription.create({
        data: {
          subjectType: "user",
          subjectId: user.id,
          planId: plan.id,
          status: "active",
          source: "self",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
        },
      });
      const job = await newJob();
      const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
      expect(result.status, plan.code).toBe("applied");
    }
  });

  it("même si un droit « jobs.apply » est retiré et tous les quotas sont à zéro", async () => {
    const user = await talent();
    const keys = await db.planEntitlement.findMany({ distinct: ["key"], select: { key: true } });
    await db.entitlementOverride.createMany({
      data: [
        {
          subjectType: "user",
          subjectId: user.id,
          key: "jobs.apply",
          value: "false",
          reason: "test",
        },
        ...keys
          .filter(({ key }) => /\.(monthly|max)$/.test(key))
          .map(({ key }) => ({
            subjectType: "user" as const,
            subjectId: user.id,
            key,
            value: "0",
            reason: "test",
          })),
      ],
    });
    const job = await newJob();
    expect((await applyToJob(db, { userId: user.id, jobSlug: job.slug })).status).toBe("applied");
  });

  it("le service et l'action de candidature n'importent pas le moteur de droits", () => {
    for (const file of ["src/server/services/applications.ts", "src/server/actions/jobs.ts"]) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/@\/server\/entitlements/);
      expect(source).not.toMatch(/\b(can|consume|limit)\(/);
    }
  });
});

describe("cycle d'une candidature", () => {
  it("refuse un doublon, garde une copie du CV, puis se retire", async () => {
    const user = await talent();
    const profile = await db.talentProfile.create({ data: { userId: user.id } });
    const cv = await db.document.create({
      data: { profileId: profile.id, kind: "cv", title: "CV test", content: { summary: "Avant" } },
    });
    const job = await newJob();
    const first = await applyToJob(db, { userId: user.id, jobSlug: job.slug, cvDocumentId: cv.id });
    expect(first.status).toBe("applied");
    expect((await applyToJob(db, { userId: user.id, jobSlug: job.slug })).status).toBe("already");

    // Editing the CV later does not change what the recruiter received.
    await db.document.update({ where: { id: cv.id }, data: { content: { summary: "Après" } } });
    const [application] = await listApplications(db, user.id);
    expect(application?.cvSnapshot).toMatchObject({
      title: "CV test",
      content: { summary: "Avant" },
    });
    expect(application && talentStatus(application)).toBe("sent");
    expect(application?.events.map((event) => event.type)).toEqual(["submitted"]);

    expect(await withdrawApplication(db, user.id, application!.id)).toBe(true);
    const [after] = await listApplications(db, user.id);
    expect(after && talentStatus(after)).toBe("withdrawn");
    // Someone else cannot withdraw it.
    const other = await talent();
    expect(await withdrawApplication(db, other.id, application!.id)).toBe(false);
  });

  it("refuse une offre close ou inconnue", async () => {
    const user = await talent();
    const closed = await newJob(new Date(Date.now() - 86_400_000));
    expect((await applyToJob(db, { userId: user.id, jobSlug: closed.slug })).status).toBe("closed");
    expect((await applyToJob(db, { userId: user.id, jobSlug: "inconnue" })).status).toBe(
      "notFound",
    );
  });

  it("n'utilise pas le CV d'une autre personne", async () => {
    const owner = await talent();
    const ownerProfile = await db.talentProfile.create({ data: { userId: owner.id } });
    const cv = await db.document.create({
      data: { profileId: ownerProfile.id, kind: "cv", title: "CV d'autrui", content: {} },
    });
    const user = await talent();
    const job = await newJob();
    await applyToJob(db, { userId: user.id, jobSlug: job.slug, cvDocumentId: cv.id });
    const [application] = await listApplications(db, user.id);
    expect(application?.cvSnapshot).toBeNull();
  });
});
