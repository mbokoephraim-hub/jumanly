import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { postCompanyNotice } from "@/server/services/company-notice";
import { HireError, publishJob, saveJob, type HireContext } from "@/server/services/hire";
import { addQuestion, createTest, sendTest } from "@/server/services/hire-v3-tests";
import {
  automationHistory,
  automationOverview,
  runTestReminders,
  setRule,
} from "@/server/services/hire-v3-automation";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function member(
  organizationId: string,
  role: MembershipRole = "org_owner",
): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

/** A verified organization on the plan whose entitlement `key` is `value` (never a plan name). */
async function org(entitlement?: { key: string; value: string }) {
  const organization = await newOrganization("recruiter");
  orgs.push(organization.id);
  if (entitlement) {
    const plan = await db.plan.findFirstOrThrow({
      where: {
        family: { in: ["rh", "company"] },
        entitlements: { some: entitlement },
      },
      orderBy: { sortOrder: "asc" },
    });
    const now = new Date();
    await db.subscription.create({
      data: {
        subjectType: "organization",
        subjectId: organization.id,
        planId: plan.id,
        status: "active",
        source: "admin",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      },
    });
  }
  return db.organization.update({
    where: { id: organization.id },
    data: { verifiedAt: new Date() },
  });
}

async function publishedJob(ctx: HireContext) {
  const saved = await saveJob(db, ctx, {
    title: "Analyste fictif",
    contractType: "cdi",
    remote: "onsite",
    city: "Kinshasa",
    country: "Congo-Kinshasa",
    salaryMin: "",
    salaryMax: "",
    closesAt: "",
    description: "Suivi des indicateurs d'une structure fictive.",
    responsibilities: "Suivre\nPrésenter",
    requirements: "",
    benefits: "",
    experienceMin: "0",
    requiredSkills: "SQL",
    preferredSkills: "",
    knockout: "",
    rejectionTemplate: "",
  });
  if (!saved.ok) throw new Error(saved.error);
  await publishJob(db, ctx, saved.jobId);
  return saved.jobId;
}

async function applicant(jobId: string, coverLetter?: string) {
  const user = await newUser();
  users.push(user.id);
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
  if (result.status !== "applied") throw new Error(result.status);
  if (coverLetter)
    await db.application.update({ where: { id: result.applicationId }, data: { coverLetter } });
  return { userId: user.id, applicationId: result.applicationId };
}

const ON = { key: "hire.assessments", value: "true" };
const DAY = 86_400_000;

describe("suivi automatique (Hire v3, lot 4)", () => {
  it("reminds a test twice (J+2, J+4), then never again", async () => {
    const ctx = await member((await org(ON)).id);
    const jobId = await publishedJob(ctx);
    const a = await applicant(jobId);
    const test = await createTest(db, ctx, { jobId, templateKey: "sql" });
    const sentAt = new Date(Date.now() - 10 * DAY);
    await sendTest(db, ctx, test.id, undefined, sentAt);
    expect(await runTestReminders(db, new Date(sentAt.getTime() + DAY))).toBe(0);
    await runTestReminders(db, new Date(sentAt.getTime() + 2 * DAY + 60_000));
    await runTestReminders(db, new Date(sentAt.getTime() + 3 * DAY));
    await runTestReminders(db, new Date(sentAt.getTime() + 4 * DAY + 60_000));
    await runTestReminders(db, new Date(sentAt.getTime() + 9 * DAY));
    const invite = await db.skillTestInvite.findFirstOrThrow({ where: { testId: test.id } });
    expect(invite.reminders).toBe(2);
    const events = await db.applicationEvent.count({
      where: { applicationId: a.applicationId, type: "test_reminded" },
    });
    expect(events).toBe(2);
    const history = await automationHistory(db, ctx);
    expect(history.rows.filter((r) => r.rule === "testReminder")).toHaveLength(2);
    expect(history.rows[0]?.result).toBe("notSubmitted");
  });

  it("a rule turned off stops for every offer; members who don't manage cannot change it", async () => {
    const organization = await org(ON);
    const ctx = await member(organization.id);
    const viewer = await member(organization.id, "hiring_manager");
    await expect(setRule(db, viewer, "testReminder", false)).rejects.toBeInstanceOf(HireError);
    await setRule(db, ctx, "testReminder", false);
    await setRule(db, ctx, "acknowledgement", false);
    const jobId = await publishedJob(ctx);
    const a = await applicant(jobId);
    // No acknowledgement while the rule is off.
    expect(await postCompanyNotice(db, a.applicationId, "received", null)).toBeNull();
    const test = await createTest(db, ctx, { jobId, templateKey: "sql" });
    await addQuestion(db, ctx, test.id, {
      kind: "short",
      prompt: "Une question écrite fictive.",
      choices: [],
      answer: null,
      points: 1,
    });
    const sentAt = new Date(Date.now() - 10 * DAY);
    await sendTest(db, ctx, test.id, undefined, sentAt);
    await runTestReminders(db, new Date(sentAt.getTime() + 5 * DAY));
    const invite = await db.skillTestInvite.findFirstOrThrow({ where: { testId: test.id } });
    expect(invite.reminders).toBe(0);
    const overview = await automationOverview(db, ctx);
    expect(overview.rules.find((r) => r.key === "testReminder")?.enabled).toBe(false);
    expect(overview.rules.find((r) => r.key === "slotReminder")?.enabled).toBe(true);
  });

  it("never shows another organization's sends (golden rule n° 6)", async () => {
    const other = await member((await org(ON)).id);
    const history = await automationHistory(db, other);
    expect(history.rows).toEqual([]);
  });
});
