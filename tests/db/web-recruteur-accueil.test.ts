import { afterAll, describe, expect, it } from "vitest";
import type { HireContext } from "@/server/services/hire";
import {
  dayBounds,
  recruiterWebCounts,
  webHome,
  webHomeAdmin,
} from "@/server/services/hire-web-home";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Recruteur sur ordinateur (Modèle B) · N1 : l'accueil et les compteurs de la barre latérale ne
// lisent que l'organisation du membre (règle d'or n° 6) ; les chiffres sont les vrais.

const users: string[] = [];
const orgs: string[] = [];
const DAY = 86_400_000;

afterAll(async () => {
  await db.orgTask.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.interview.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.application.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.pipelineStage.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.talentProfile.deleteMany({ where: { userId: { in: users } } });
  await db.subscription.deleteMany({ where: { subjectId: { in: orgs } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function user() {
  const created = await newUser();
  users.push(created.id);
  return created;
}

/** A company with its owner on a paid plan, one offer and `count` unseen applications. */
async function company(count: number) {
  const owner = await user();
  const org = await newOrganization("company");
  orgs.push(org.id);
  await db.membership.create({
    data: { userId: owner.id, organizationId: org.id, role: "org_owner" },
  });
  const plan = await db.plan.findUniqueOrThrow({ where: { code: "company" } });
  const periodEnd = new Date(Date.now() + 30 * DAY);
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: org.id,
      planId: plan.id,
      status: "active",
      source: "self",
      currentPeriodStart: new Date(Date.now() - DAY),
      currentPeriodEnd: periodEnd,
    },
  });
  const job = await db.job.create({
    data: {
      organizationId: org.id,
      title: "Analyste fictif",
      slug: `test-${org.id}-${Math.random().toString(36).slice(2)}`,
      description: "Offre fictive.",
      contractType: "cdi",
      remote: "onsite",
      city: "Goma",
      country: "RD Congo",
      status: "published",
    },
  });
  const stage = await db.pipelineStage.create({
    data: { jobId: job.id, name: "Nouvelles", kind: "new", order: 0 },
  });
  const applications = [];
  for (let index = 0; index < count; index++) {
    const talent = await user();
    const profile = await db.talentProfile.create({ data: { userId: talent.id } });
    applications.push(
      await db.application.create({
        data: { jobId: job.id, profileId: profile.id, stageId: stage.id, matchScore: 60 + index },
      }),
    );
  }
  const ctx: HireContext = { userId: owner.id, organizationId: org.id, role: "org_owner" };
  return { owner, org, ctx, job, applications, periodEnd };
}

describe("Accueil du recruteur sur ordinateur", () => {
  it("compte et liste seulement ce qui appartient à l'organisation", async () => {
    const mine = await company(2);
    const other = await company(3);
    // An appointment today and a late task in the other company only.
    const now = new Date();
    await db.interview.create({
      data: {
        organizationId: other.org.id,
        applicationId: other.applications[0]!.id,
        organizerId: other.owner.id,
        startsAt: new Date(dayBounds(now).start.getTime() + 12 * 3_600_000),
        durationMinutes: 30,
        timezone: "Africa/Kinshasa",
        mode: "video",
        status: "confirmed",
      },
    });
    await db.orgTask.create({
      data: {
        organizationId: other.org.id,
        assigneeId: other.owner.id,
        kind: "follow",
        applicationId: other.applications[0]!.id,
        dueAt: new Date(now.getTime() - DAY),
      },
    });

    const counts = await recruiterWebCounts(db, mine.ctx, now);
    expect(counts.applications).toBe(2);
    expect(counts.interviews).toBe(0);

    const home = await webHome(db, mine.ctx, now);
    expect(home.interviews).toEqual([]);
    expect(home.offers.map((offer) => offer.id)).toEqual([mine.job.id]);
    // « Orbi résume » names the best unseen application of the company, never another one's.
    expect(home.best?.id).toBe(mine.applications[1]!.id);

    const admin = await webHomeAdmin(db, mine.ctx, now);
    expect(admin.teamTasks).toEqual([]);
    expect(admin.late).toBe(0);
    expect(admin.month.applications).toBe(2);
    expect(admin.renewal?.getTime()).toBe(mine.periodEnd.getTime());

    const theirs = await webHomeAdmin(db, other.ctx, now);
    expect(theirs.late).toBe(1);
    expect(theirs.teamTasks).toHaveLength(1);
    expect((await recruiterWebCounts(db, other.ctx, now)).interviews).toBe(1);
  });
});
