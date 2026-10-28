/**
 * Modèle B recruteur au téléphone (docs/modele-b-recruteur): the figures of the bar and the
 * search in two steps stay inside the active organization (golden rule n° 6), and searching never
 * counts as consulting a profile (only opening a file does, golden rule n° 5).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { applyToJob } from "@/server/services/applications";
import { publishJob, saveJob, type HireContext } from "@/server/services/hire";
import { recruiterBarCounts, recruiterPhoneSearch } from "@/server/services/hire-phone";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function member(organizationId: string, role: MembershipRole = "org_owner") {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role } satisfies HireContext;
}

async function company() {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  await db.organization.update({
    where: { id: organization.id },
    data: { verifiedAt: new Date() },
  });
  return member(organization.id);
}

async function publishedJob(ctx: HireContext, title: string) {
  const saved = await saveJob(db, ctx, {
    title,
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

async function applicant(jobId: string, firstName: string) {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({
    where: { id: user.id },
    data: { firstName, name: `${firstName} Fictif` },
  });
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
  if (result.status !== "applied") throw new Error(result.status);
  return result.applicationId;
}

describe("Modèle B recruteur : barre et recherche au téléphone", () => {
  it("compte les nouvelles candidatures de sa seule organisation", async () => {
    const mine = await company();
    const other = await company();
    const job = await publishedJob(mine, "Analyste fictif");
    const otherJob = await publishedJob(other, "Analyste fictif");
    const opened = await applicant(job, "Ama");
    await applicant(job, "Kofi");
    await applicant(otherJob, "Nadia");
    await db.application.update({ where: { id: opened }, data: { viewedAt: new Date() } });

    expect((await recruiterBarCounts(db, mine)).newApplications).toBe(1);
    expect((await recruiterBarCounts(db, other)).newApplications).toBe(1);
  });

  it("cherche dès la première lettre, sans sortir de l'organisation ni journaliser", async () => {
    const tag = randomUUID().slice(0, 6);
    const mine = await company();
    const other = await company();
    const job = await publishedJob(mine, `Comptable ${tag}`);
    await publishedJob(other, `Comptable ${tag} ailleurs`);
    await applicant(job, `Zelie${tag}`);

    const offers = await recruiterPhoneSearch(db, mine, `Comptable ${tag}`);
    expect(offers.offers.map((offer) => offer.href)).toEqual([`/app/hire/offres/${job}`]);
    expect(offers.offers[0]?.applications).toBe(1);

    const people = await recruiterPhoneSearch(db, mine, `Zelie${tag}`);
    expect(people.candidates).toHaveLength(1);
    expect(people.candidates[0]?.title).toContain(`Zelie${tag}`);
    // The other organization finds neither the offer nor the candidate.
    const elsewhere = await recruiterPhoneSearch(db, other, `Zelie${tag}`);
    expect(elsewhere.candidates).toHaveLength(0);
    expect((await recruiterPhoneSearch(db, other, `Comptable ${tag}`)).offers).toHaveLength(1);
    // A search shows names only: no consultation of a profile is journaled.
    expect(
      await db.auditLog.count({ where: { actorId: mine.userId, action: "profile.view" } }),
    ).toBe(0);
    expect(await recruiterPhoneSearch(db, mine, "  ")).toEqual({ offers: [], candidates: [] });
  });
});
