/**
 * Agenda › À planifier, the window (Ephraïm 06/11/2026): « Enregistrer et envoyer » fixes the
 * interview at once (day, hour, on site or by video) and the candidate finds it in the
 * conversation; a « Délai de vérification » dates the check of a person set aside, with or
 * without pieces asked. Organization only (golden rule n° 6).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { applyToJob } from "@/server/services/applications";
import { HireError, type HireContext } from "@/server/services/hire";
import { agendaTasks } from "@/server/services/hire-agenda";
import { HOLD_EVENT } from "@/server/services/hire-classes";
import { planVerificationCheck } from "@/server/services/hire-verification";
import { fixInterview } from "@/server/services/interviews";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;
const zone = "Africa/Kinshasa";

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
  return { owner, talent, applicationId: result.applicationId };
}

const tomorrow = () => new Date(Date.now() + day).toLocaleDateString("en-CA", { timeZone: zone });

describe("Planifier l'entretien (fenêtre)", () => {
  it("fixes a video interview at once and puts it in the conversation", async () => {
    const { owner, talent, applicationId } = await setup();
    const result = await fixInterview(
      db,
      owner,
      {
        application: applicationId,
        mode: "video",
        day: tomorrow(),
        hour: "10:30",
        link: "https://meet.example.test/fictif",
        address: "",
      },
      zone,
    );
    expect(result.status).toBe("fixed");
    if (result.status !== "fixed") return;
    const interview = await db.interview.findUniqueOrThrow({ where: { id: result.interviewId } });
    expect(interview).toMatchObject({
      status: "confirmed",
      mode: "video",
      link: "https://meet.example.test/fictif",
    });
    expect(interview.startsAt).toEqual(result.startsAt);
    const message = await db.message.findFirstOrThrow({
      where: { conversationId: result.conversationId, kind: "invitation" },
    });
    expect(message.payload).toMatchObject({ interviewId: interview.id });
    expect(
      await db.notification.count({ where: { userId: talent.id, type: "interviewFixed" } }),
    ).toBe(1);
    // Planned: no longer « à planifier », and a second one is refused.
    const tasks = await agendaTasks(db, owner);
    expect(tasks.toPlan.find((item) => item.applicationId === applicationId)).toBeUndefined();
    const again = await fixInterview(
      db,
      owner,
      { application: applicationId, mode: "onsite", day: tomorrow(), hour: "11:00" },
      zone,
    );
    expect(again.status).toBe("taken");
  });

  it("asks for the link by video, refuses the past and another organization", async () => {
    const { owner, applicationId } = await setup();
    const input = { application: applicationId, day: tomorrow(), hour: "09:00" };
    expect(
      (await fixInterview(db, owner, { ...input, mode: "video", link: "" }, zone)).status,
    ).toBe("invalid");
    const yesterday = new Date(Date.now() - day).toLocaleDateString("en-CA", { timeZone: zone });
    expect(
      (await fixInterview(db, owner, { ...input, mode: "onsite", day: yesterday }, zone)).status,
    ).toBe("past");
    const other = await setup();
    await expect(
      fixInterview(db, other.owner, { ...input, mode: "onsite" }, zone),
    ).rejects.toBeInstanceOf(HireError);
  });
});

describe("Délai de vérification", () => {
  it("dates the check of a person set aside without pieces asked", async () => {
    const { owner, applicationId } = await setup();
    await db.applicationEvent.create({
      data: { applicationId, actorId: owner.userId, type: HOLD_EVENT },
    });
    const now = new Date();
    const checkAt = new Date(now.getTime() + 5 * day);
    const planned = await planVerificationCheck(db, owner, applicationId, checkAt, now);
    expect(planned.conversationId).toBeTruthy();
    const tasks = await agendaTasks(db, owner, now);
    const review = tasks.reviews.find((item) => item.applicationId === applicationId);
    expect(review?.checkAt).toEqual(checkAt);
    expect(review?.due).toBe(false);
  });

  it("refuses someone neither set aside nor asked for pieces", async () => {
    const { owner, applicationId } = await setup();
    await expect(
      planVerificationCheck(db, owner, applicationId, new Date(Date.now() + day), new Date()),
    ).rejects.toBeInstanceOf(HireError);
  });
});
