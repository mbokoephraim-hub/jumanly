/**
 * « Programmer la campagne » (Agenda, Ephraïm 05/11/2026): a ready draft opens by itself at the
 * hour chosen, the member is told, and the agenda shows it. Organization only (golden rule n° 6).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { scheduleJob, unscheduleJob, type HireContext } from "@/server/services/hire";
import { agendaCampaigns } from "@/server/services/hire-agenda";
import { runScheduledOpenings } from "@/server/services/job-schedule";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.skill.deleteMany({ where: { slug: { startsWith: "test-camp-" } } });
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function member(organizationId: string, role: MembershipRole): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

async function company() {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  const plan = await db.plan.findUniqueOrThrow({ where: { code: "company_plus" } });
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: organization.id,
      planId: plan.id,
      status: "active",
      source: "admin",
      currentPeriodStart: new Date(Date.now() - day),
      currentPeriodEnd: new Date(Date.now() + 30 * day),
    },
  });
  return member(organization.id, "org_owner");
}

async function draft(ctx: HireContext, closesInDays = 30) {
  const slug = `test-camp-${randomUUID().slice(0, 8)}`;
  const skill = await db.skill.create({
    data: { slug, name: `Analyse ${slug}`, category: "test" },
  });
  const job = await db.job.create({
    data: {
      organizationId: ctx.organizationId,
      slug: `test-${randomUUID()}`,
      title: "Analyste fictif",
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "draft",
      closesAt: new Date(Date.now() + closesInDays * day),
      createdById: ctx.userId,
      skills: { create: [{ skillId: skill.id, importance: "required", weight: 5 }] },
    },
  });
  return job.id;
}

describe("Programmer la campagne", () => {
  it("opens the draft at the hour chosen and tells the member", async () => {
    const owner = await company();
    const jobId = await draft(owner);
    const now = new Date();
    const opensAt = new Date(now.getTime() + 2 * 3_600_000);
    expect(await scheduleJob(db, owner, jobId, opensAt, now)).toEqual({
      status: "scheduled",
      jobId,
    });
    const listed = await agendaCampaigns(db, owner, now);
    expect(listed.find((item) => item.jobId === jobId)?.opensAt).toEqual(opensAt);

    // Before the hour nothing happens; at the hour it opens, once.
    await runScheduledOpenings(db, now);
    expect((await db.job.findUniqueOrThrow({ where: { id: jobId } })).status).toBe("draft");
    await runScheduledOpenings(db, new Date(opensAt.getTime() + 60_000));
    const opened = await db.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(["published", "pending_review"]).toContain(opened.status);
    expect(opened.opensAt).toBeNull();
    expect(
      await db.notification.count({ where: { userId: owner.userId, type: "jobOpened" } }),
    ).toBe(1);
    await runScheduledOpenings(db, new Date(opensAt.getTime() + 2 * 60_000));
    expect(
      await db.notification.count({ where: { userId: owner.userId, type: "jobOpened" } }),
    ).toBe(1);
  });

  it("refuses an opening in the past or after the end, and can be cancelled", async () => {
    const owner = await company();
    const jobId = await draft(owner, 2);
    const now = new Date();
    expect(await scheduleJob(db, owner, jobId, new Date(now.getTime() - 60_000), now)).toEqual({
      status: "invalid",
    });
    expect(await scheduleJob(db, owner, jobId, new Date(now.getTime() + 3 * day), now)).toEqual({
      status: "invalid",
    });
    await scheduleJob(db, owner, jobId, new Date(now.getTime() + day), now);
    await unscheduleJob(db, owner, jobId);
    expect((await db.job.findUniqueOrThrow({ where: { id: jobId } })).opensAt).toBeNull();
    const other = await company();
    await expect(
      scheduleJob(db, other, jobId, new Date(now.getTime() + day), now),
    ).rejects.toThrow();
  });
});
