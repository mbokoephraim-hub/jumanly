import { afterAll, describe, expect, it } from "vitest";
import type { HireContext } from "@/server/services/hire";
import { webOfferOverview, webOffers } from "@/server/services/hire-web-offers";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Recruteur sur ordinateur (Modèle B) · N2 : la liste des offres et l'aperçu d'une offre ne lisent
// que l'organisation du membre (règle d'or n° 6) ; les chiffres sont les vrais.

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

describe("Offres du recruteur sur ordinateur", () => {
  it("chiffre seulement les offres de l'organisation", async () => {
    const mine = await company(2);
    const other = await company(3);
    const now = new Date();
    // The team moved one of the two applications: half of them received an answer.
    await db.applicationEvent.create({
      data: {
        applicationId: mine.applications[0]!.id,
        actorId: mine.owner.id,
        type: "stage_changed",
        createdAt: new Date(mine.applications[0]!.createdAt.getTime() + 2 * DAY),
      },
    });

    const list = await webOffers(db, mine.ctx, now);
    expect(list.offers.map((offer) => offer.id)).toEqual([mine.job.id]);
    expect(list.figures.applications).toBe(2);
    expect(list.figures.week).toBe(2);
    expect(list.figures.answeredShare).toBe(0.5);
    expect(list.figures.responseDays).toBe(2);
    expect(list.offers[0]!.week).toBe(2);

    const overview = await webOfferOverview(db, mine.ctx, mine.job.id, now);
    expect(overview.applications).toBe(2);
    expect(overview.sources.find((row) => row.source === "direct")?.count).toBe(2);
    expect(overview.stages.reduce((sum, stage) => sum + stage.count, 0)).toBe(2);

    // Another company's offer is never read.
    await expect(webOfferOverview(db, mine.ctx, other.job.id, now)).rejects.toThrow();
    expect((await webOffers(db, other.ctx, now)).figures.applications).toBe(3);
  });
});
