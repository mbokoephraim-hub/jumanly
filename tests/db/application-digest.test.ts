/**
 * « Un résumé par jour » of the new applications (évaluation recruteur, 06/11/2026): a member who
 * chose it gets one summary a day, one line per offer, and no e-mail for each application.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { dueApplicationDigests } from "@/server/services/application-digest";
import { ensureStages } from "@/server/services/applications";
import { mailsEachApplication, NEW_APPLICATION_DIGEST } from "@/server/services/notifications";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const hour = 3_600_000;

afterAll(async () => {
  await db.jobRun.deleteMany({ where: { key: { contains: orgs[0] ?? "none" } } });
  await db.application.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function setup() {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  const recruiter = await newUser();
  users.push(recruiter.id);
  await db.membership.create({
    data: { userId: recruiter.id, organizationId: organization.id, role: "recruiter" },
  });
  await db.user.update({
    where: { id: recruiter.id },
    data: { notificationsMuted: [NEW_APPLICATION_DIGEST] },
  });
  const job = await db.job.create({
    data: {
      organizationId: organization.id,
      slug: `test-${randomUUID()}`,
      title: "Analyste résumé fictif",
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
      createdById: recruiter.id,
    },
  });
  return { organization, recruiter, job };
}

async function applicant(jobId: string, createdAt: Date) {
  const talent = await newUser();
  users.push(talent.id);
  const profile = await db.talentProfile.create({ data: { userId: talent.id } });
  const [stage] = await ensureStages(db, jobId);
  await db.application.create({
    data: { jobId, profileId: profile.id, stageId: stage!.id, createdAt },
  });
}

describe("résumé quotidien des candidatures", () => {
  it("chaque candidature ou le résumé, selon le choix", () => {
    expect(mailsEachApplication({ notificationEmails: true, notificationsMuted: [] })).toBe(true);
    expect(
      mailsEachApplication({
        notificationEmails: true,
        notificationsMuted: [NEW_APPLICATION_DIGEST],
      }),
    ).toBe(false);
    expect(
      mailsEachApplication({ notificationEmails: true, notificationsMuted: ["rh.applications"] }),
    ).toBe(false);
    expect(mailsEachApplication({ notificationEmails: false, notificationsMuted: [] })).toBe(false);
  });

  it("une fois par jour, après 7 h UTC, les candidatures des dernières 24 heures", async () => {
    const { recruiter, job } = await setup();
    const now = new Date("2031-03-04T08:15:00Z");
    await applicant(job.id, new Date(now.getTime() - 2 * hour));
    await applicant(job.id, new Date(now.getTime() - 20 * hour));
    // Older than a day: already in yesterday's summary.
    await applicant(job.id, new Date(now.getTime() - 30 * hour));

    expect(await dueApplicationDigests(db, new Date("2031-03-04T06:30:00Z"))).toEqual([]);
    const digests = (await dueApplicationDigests(db, now)).filter(
      (digest) => digest.to.id === recruiter.id,
    );
    expect(digests).toHaveLength(1);
    expect(digests[0]!.jobs).toEqual([{ title: "Analyste résumé fictif", count: 2 }]);
    // The next hourly run of the same day sends nothing more.
    const again = await dueApplicationDigests(db, new Date(now.getTime() + hour));
    expect(again.filter((digest) => digest.to.id === recruiter.id)).toEqual([]);
  });
});
