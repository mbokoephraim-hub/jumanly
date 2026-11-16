import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { HireError, publishJob, saveJob, type HireContext } from "@/server/services/hire";
import { companyOverview } from "@/server/services/hire-v3-company";
import { memberFile } from "@/server/services/hire-v3-team";
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

describe("page entreprise et fiche membre (Hire v3, lot 6)", () => {
  it("counts the organization's real offers, applications and team", async () => {
    const organization = await org();
    const ctx = await member(organization.id);
    const jobId = await publishedJob(ctx);
    await applicant(jobId);
    const data = await companyOverview(db, ctx);
    expect(data.liveCount).toBe(1);
    expect(data.applications).toBe(1);
    expect(data.team).toHaveLength(1);
    expect(data.canEdit).toBe(true);
    const viewer = await member(organization.id, "hiring_manager");
    expect((await companyOverview(db, viewer)).canEdit).toBe(false);
  });

  it("opens a member's file for an administrator or the member, never another organization", async () => {
    const organization = await org();
    const admin = await member(organization.id);
    const recruiter = await member(organization.id, "recruiter");
    const colleague = await member(organization.id, "recruiter");
    const seat = await db.membership.findFirstOrThrow({
      where: { userId: recruiter.userId, organizationId: organization.id },
    });
    const file = await memberFile(db, admin, seat.id);
    expect(file.role).toBe("recruiter");
    expect((await memberFile(db, recruiter, seat.id)).me).toBe(true);
    await expect(memberFile(db, colleague, seat.id)).rejects.toBeInstanceOf(HireError);
    const stranger = await member((await org()).id);
    await expect(memberFile(db, stranger, seat.id)).rejects.toBeInstanceOf(HireError);
  });
});
