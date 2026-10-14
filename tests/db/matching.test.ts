import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  activeWeights,
  createDispute,
  matchForUser,
  parseExplanation,
  recommendedJobs,
  resolveDispute,
} from "@/server/matching/service";
import { scoreFromCriteria } from "@/server/matching/score";
import { applyToJob } from "@/server/services/applications";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const jobs: string[] = [];

afterAll(async () => {
  await db.application.deleteMany({ where: { jobId: { in: jobs } } });
  await db.pipelineStage.deleteMany({ where: { jobId: { in: jobs } } });
  await db.$executeRaw`DELETE FROM "Embedding" WHERE "subjectId" = ANY(${jobs})`;
  await db.job.deleteMany({ where: { id: { in: jobs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function skills() {
  const rows = await db.skill.findMany({ take: 3, orderBy: { slug: "asc" } });
  expect(rows.length).toBe(3);
  return rows;
}

async function newJob() {
  const org = await newOrganization("company");
  orgs.push(org.id);
  const [a, b, c] = await skills();
  const job = await db.job.create({
    data: {
      organizationId: org.id,
      title: "Analyste fictif",
      slug: `test-${randomUUID()}`,
      description: "Offre de test pour le calcul de compatibilité.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "Congo-Kinshasa",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
      closesAt: new Date(Date.now() + 7 * 86_400_000),
      skills: {
        create: [
          { skillId: a!.id, importance: "required" },
          { skillId: b!.id, importance: "required" },
          { skillId: c!.id, importance: "preferred" },
        ],
      },
    },
  });
  jobs.push(job.id);
  return job;
}

async function talent(withSkills = true) {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({ where: { id: user.id }, data: { city: "Kinshasa", country: "CD" } });
  const [a] = await skills();
  await db.talentProfile.create({
    data: {
      userId: user.id,
      headline: "Analyste",
      desiredContracts: ["cdi"],
      skills: withSkills ? { create: [{ skillId: a!.id, level: 3 }] } : undefined,
    },
  });
  return user;
}

describe("calcul de compatibilité en base (partie 08)", () => {
  it("le score affiché est celui que l'on recalcule depuis l'explication", async () => {
    const [user, job] = [await talent(), await newJob()];
    const match = await matchForUser(db, user.id, job.id);
    expect(match.state).toBe("ok");
    if (match.state !== "ok") return;
    const weights = await activeWeights(db);
    expect(match.explanation.weightsVersion).toBe(weights.version);
    expect(scoreFromCriteria(match.explanation.criteria)).toBe(match.explanation.score);
    const stored = await db.matchResult.findFirstOrThrow({
      where: { jobId: job.id, profile: { userId: user.id } },
    });
    expect(stored.score).toBe(match.explanation.score);
  });

  it("contrefactuel : changer le nom, la photo ou les prénoms ne change pas le score", async () => {
    const [user, job] = [await talent(), await newJob()];
    const before = await matchForUser(db, user.id, job.id);
    await db.user.update({
      where: { id: user.id },
      data: {
        name: "Autre Nom Fictif",
        firstName: "Autre",
        lastName: "Personne",
        image: "https://example.test/photo.png",
      },
    });
    const after = await matchForUser(db, user.id, job.id);
    expect(before.state).toBe("ok");
    expect(after.state).toBe("ok");
    if (before.state === "ok" && after.state === "ok") {
      expect(after.explanation.score).toBe(before.explanation.score);
      expect(after.explanation.criteria).toEqual(before.explanation.criteria);
    }
  });

  it("aucun score si le talent a désactivé le calcul ou si le profil est vide", async () => {
    const job = await newJob();
    const optedOut = await talent();
    await db.talentProfile.update({
      where: { userId: optedOut.id },
      data: { matchingEnabled: false },
    });
    expect((await matchForUser(db, optedOut.id, job.id)).state).toBe("optedOut");
    expect(await recommendedJobs(db, optedOut.id)).toEqual([]);
    const empty = await talent(false);
    expect((await matchForUser(db, empty.id, job.id)).state).toBe("incomplete");
  });

  it("le score est figé dans la candidature, qui reste gratuite", async () => {
    const [user, job] = [await talent(), await newJob()];
    const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
    expect(result.status).toBe("applied");
    const application = await db.application.findFirstOrThrow({
      where: { jobId: job.id, profile: { userId: user.id } },
    });
    const frozen = parseExplanation(application.matchExplanation);
    expect(frozen).not.toBeNull();
    expect(application.matchScore).toBe(frozen!.score);
  });

  it("une révision humaine : une seule demande ouverte, réponse notifiée au talent", async () => {
    const [user, job] = [await talent(), await newJob()];
    const admin = await newUser();
    users.push(admin.id);
    const input = {
      job: job.slug,
      reason: "skill" as const,
      details: "Je maîtrise cette compétence depuis trois ans.",
      notifyRecruiter: true,
    };
    expect(await createDispute(db, user.id, input)).toBe("created");
    expect(await createDispute(db, user.id, input)).toBe("already");
    const dispute = await db.matchDispute.findFirstOrThrow({ where: { userId: user.id } });
    // Without an application, the recruiter is not involved.
    expect(dispute.notifyRecruiter).toBe(false);
    await resolveDispute(db, admin.id, {
      id: dispute.id,
      outcome: "confirmed",
      resolution: "Le calcul a été vérifié.",
    });
    const closed = await db.matchDispute.findUniqueOrThrow({ where: { id: dispute.id } });
    expect(closed.status).toBe("confirmed");
    expect(await db.notification.count({ where: { userId: user.id, type: "matchReviewed" } })).toBe(
      1,
    );
    // A closed review cannot be reopened by a second answer.
    expect(
      await resolveDispute(db, admin.id, { id: dispute.id, outcome: "corrected", resolution: "" }),
    ).toBeNull();
    await db.matchDispute.deleteMany({ where: { userId: user.id } });
  });
});
