import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { HireError, publishJob, saveJob, type HireContext } from "@/server/services/hire";
import {
  addQuestion,
  candidateTest,
  createTest,
  gradeInvite,
  sendTest,
  submitInvite,
  testResults,
  testsOverview,
  inviteForTalent,
} from "@/server/services/hire-v3-tests";
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

describe("tests de compétences (Hire v3, lot 3)", () => {
  it("refuses to create a test when the plan has no tests", async () => {
    const organization = await org({ key: "hire.assessments", value: "false" });
    const ctx = await member(organization.id);
    await expect(createTest(db, ctx, { title: "Test fictif" })).rejects.toBeInstanceOf(HireError);
  });

  it("copies a library template, sends it, corrects choices and waits for the team on written answers", async () => {
    const organization = await org(ON);
    const ctx = await member(organization.id);
    const jobId = await publishedJob(ctx);
    const a = await applicant(jobId);
    const b = await applicant(jobId);
    const test = await createTest(db, ctx, { jobId, templateKey: "sql" });
    const copied = await db.skillTestQuestion.count({ where: { testId: test.id } });
    expect(copied).toBe(4);
    await addQuestion(db, ctx, test.id, {
      kind: "short",
      prompt: "Expliquez une jointure externe.",
      choices: [],
      answer: null,
      points: 2,
    });
    expect(await sendTest(db, ctx, test.id)).toBe(2);
    // Sent once: a second send reaches nobody new.
    expect(await sendTest(db, ctx, test.id)).toBe(0);
    const inviteA = await db.skillTestInvite.findFirstOrThrow({
      where: { testId: test.id, applicationId: a.applicationId },
      include: { test: { include: { questions: { orderBy: { order: "asc" } } } } },
    });
    // Only the candidate opens the invite (golden rule n° 5).
    expect(await inviteForTalent(db, b.userId, inviteA.id)).toBeNull();
    const questions = inviteA.test.questions;
    const answers: Record<string, number | string> = {};
    for (const q of questions)
      answers[q.id] = q.kind === "choice" ? (q.answer ?? 0) : "Elle garde toutes les lignes.";
    await submitInvite(db, a.userId, inviteA.id, answers);
    let file = await candidateTest(db, ctx, a.applicationId);
    expect(file?.submittedAt).not.toBeNull();
    expect(file?.score).toBeNull();
    expect(file?.toGrade).toBe(1);
    const short = questions.find((q) => q.kind === "short")!;
    await gradeInvite(db, ctx, inviteA.id, { [short.id]: 2 });
    file = await candidateTest(db, ctx, a.applicationId);
    expect(file?.score).toBe(100);
    const results = await testResults(db, ctx, test.id);
    expect(results.sent).toBe(2);
    expect(results.submitted).toBe(1);
    expect(results.ranking[0]?.applicationId).toBe(a.applicationId);
    const overview = await testsOverview(db, ctx);
    expect(overview.tests.find((x) => x.id === test.id)?.status).toBe("live");
    // The candidate's message carries the link to the test.
    const message = await db.message.findFirst({
      where: { conversation: { applicationId: a.applicationId }, senderId: null },
      orderBy: { createdAt: "desc" },
    });
    expect(JSON.stringify(message?.payload)).toContain(`/app/test/${inviteA.id}`);
  });

  it("never shows another organization's test (golden rule n° 6)", async () => {
    const mine = await member((await org(ON)).id);
    const other = await member((await org(ON)).id);
    const test = await createTest(db, mine, { title: "Test fictif" });
    await expect(testResults(db, other, test.id)).rejects.toBeInstanceOf(HireError);
    expect((await testsOverview(db, other)).tests).toEqual([]);
  });
});
