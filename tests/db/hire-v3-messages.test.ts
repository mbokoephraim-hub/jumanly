import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { ConnectError, ensureApplicationConversation } from "@/server/services/connect";
import { publishJob, saveJob, type HireContext } from "@/server/services/hire";
import { candidateConversation, messagesInbox } from "@/server/services/hire-v3-messages";
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

describe("messages du recruteur (Hire v3, lot 5)", () => {
  it("shows a candidate's conversation as the organization and marks it read", async () => {
    const ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    const a = await applicant(jobId);
    const conversation = await ensureApplicationConversation(db, a.applicationId);
    await db.message.create({
      data: { conversationId: conversation.id, senderId: a.userId, body: "Bonjour, fictif." },
    });
    const inbox = await messagesInbox(db, ctx);
    expect(inbox.rows.some((row) => row.tab === "reseau")).toBe(false);
    const view = await candidateConversation(db, ctx, conversation.id);
    expect(view.application?.id).toBe(a.applicationId);
    expect(view.messages.at(-1)?.mine).toBe(false);
    expect(view.canWrite).toBe(true);
    const read = await db.conversationParticipant.findFirst({
      where: { conversationId: conversation.id, userId: ctx.userId },
    });
    expect(read?.lastReadAt).not.toBeNull();
  });

  it("never opens another organization's conversation (golden rule n° 6)", async () => {
    const ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    const a = await applicant(jobId);
    const conversation = await ensureApplicationConversation(db, a.applicationId);
    const other = await member((await org()).id);
    await expect(candidateConversation(db, other, conversation.id)).rejects.toBeInstanceOf(
      ConnectError,
    );
    expect((await messagesInbox(db, other)).rows).toEqual([]);
  });
});
