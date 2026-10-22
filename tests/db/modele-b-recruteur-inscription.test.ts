/**
 * Modèle B recruteur, M2: the recruiter's profile on a phone. A person only finds companies they
 * may join (never their own space, never someone's personal space), a request stays theirs, and
 * creating the page turns the personal space into it (same offers, same history).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { respondJoin } from "@/server/services/org-join";
import {
  becomeIndependent,
  companyState,
  createCompany,
  ensureRecruiterProfile,
  finishRecruiterProfile,
  requestCompany,
  resetCompanyChoice,
  saveRecruiterContacts,
  saveRecruits,
  searchCompanies,
} from "@/server/services/recruiter-onboarding";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  const owned = await db.membership.findMany({
    where: { userId: { in: users } },
    select: { organizationId: true },
  });
  await db.orgJoinRequest.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await cleanup(users, [...new Set([...orgs, ...owned.map((row) => row.organizationId)])]);
  await db.$disconnect();
});

const marker = `Fictive ${randomUUID().slice(0, 8)}`;

async function recruiter() {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({ where: { id: user.id }, data: { city: "Kinshasa", country: "CD" } });
  await ensureRecruiterProfile(db, user.id);
  return user.id;
}

async function companyWithAdmin(name: string) {
  const admin = await newUser();
  users.push(admin.id);
  await db.user.update({
    where: { id: admin.id },
    data: { name: "Admin Fictif", email: `admin-${randomUUID()}@baobab-fictif.test` },
  });
  const org = await db.organization.create({
    data: {
      type: "company",
      name,
      slug: `test-${randomUUID()}`,
      city: "Kinshasa",
      memberships: { create: { userId: admin.id, role: "org_owner" } },
    },
  });
  orgs.push(org.id);
  // A paid plan with seats for the team, found by a right (never a plan name).
  const plan = await db.plan.findFirstOrThrow({
    where: {
      family: { in: ["rh", "company"] },
      entitlements: { some: { key: "hire.cv_analysis", value: "true" } },
    },
    orderBy: { sortOrder: "asc" },
  });
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: org.id,
      planId: plan.id,
      status: "active",
      source: "admin",
      currentPeriodStart: new Date(Date.now() - 86_400_000),
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
    },
  });
  return { orgId: org.id, adminId: admin.id };
}

describe("profil recruteur au téléphone", () => {
  it("finds companies by name, never one's own space nor someone's personal space", async () => {
    const { orgId } = await companyWithAdmin(`${marker} Baobab`);
    const other = await recruiter();
    await becomeIndependent(db, other);
    const otherProfile = await db.recruiterProfile.findUniqueOrThrow({ where: { userId: other } });
    await db.organization.update({
      where: { id: otherProfile.personalOrganizationId! },
      data: { name: `${marker} Personne` },
    });

    const me = await recruiter();
    const found = await searchCompanies(db, me, marker);
    expect(found.map((card) => card.id)).toEqual([orgId]);
    expect(found[0]!.manager).toBe("Admin Fictif");
    expect(found[0]!.domain).toBe("baobab-fictif.test");

    // The admin of the company does not find it to « join » again.
    const admin = await db.membership.findFirstOrThrow({
      where: { organizationId: orgId },
      select: { userId: true },
    });
    expect(await searchCompanies(db, admin.userId, marker)).toEqual([]);
  });

  it("sends one request at a time, matched by domain, and tells the admins", async () => {
    const { orgId, adminId } = await companyWithAdmin(`${marker} Request`);
    const me = await recruiter();
    expect(
      await saveRecruiterContacts(db, me, {
        workEmail: "nadia@baobab-fictif.test",
        phone: "",
        phoneCountry: "CD",
        whatsapp: false,
        linkedin: "",
        contactsFor: "interview",
      }),
    ).toBeNull();
    const { request } = await requestCompany(db, me, orgId, "Bonjour, je rejoins l'équipe.");
    expect(request.matchedBy).toBe("domain");
    expect(request.message).toBe("Bonjour, je rejoins l'équipe.");
    const state = await companyState(db, me);
    expect(state.state).toBe("pending");
    // A personal space waits meanwhile, under the person's name.
    const profile = await db.recruiterProfile.findUniqueOrThrow({ where: { userId: me } });
    expect(profile.personalOrganizationId).toBeTruthy();
    expect(
      await db.notification.count({ where: { userId: adminId, type: "orgJoinRequest" } }),
    ).toBe(1);

    // Accepted by the admin: the person is in the company.
    expect(
      await respondJoin(
        db,
        { userId: adminId, organizationId: orgId, role: "org_owner" },
        request.id,
        { accept: true },
      ),
    ).toBe("accepted");
    const accepted = await companyState(db, me);
    expect(accepted.state).toBe("accepted");
    expect(accepted.state === "accepted" && accepted.card.id).toBe(orgId);
  });

  it("cancels a request, and a stranger cannot reach an unknown organization", async () => {
    const { orgId } = await companyWithAdmin(`${marker} Cancel`);
    const me = await recruiter();
    await requestCompany(db, me, orgId, "");
    await resetCompanyChoice(db, me);
    expect((await companyState(db, me)).state).toBe("none");
    expect(await db.orgJoinRequest.count({ where: { userId: me, status: "pending" } })).toBe(0);
    await expect(requestCompany(db, me, "inconnue", "")).rejects.toThrow();
  });

  it("creating the page reuses the personal space and makes the person its owner", async () => {
    const me = await recruiter();
    await becomeIndependent(db, me);
    const before = await db.recruiterProfile.findUniqueOrThrow({ where: { userId: me } });
    const orgId = await createCompany(db, me, {
      name: `${marker} Créée`,
      sector: "Fintech",
      size: "11-50",
    });
    expect(orgId).toBe(before.personalOrganizationId);
    const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
    expect(org.type).toBe("recruiter");
    expect(org.name).toBe(`${marker} Créée`);
    const state = await companyState(db, me);
    expect(state.state).toBe("created");
    // It is a company page now: other people can find it.
    const other = await recruiter();
    expect((await searchCompanies(db, other, `${marker} Créée`)).map((c) => c.id)).toEqual([orgId]);
  });

  it("keeps the domains and finishes the profile", async () => {
    const me = await recruiter();
    expect(
      await saveRecruits(db, me, {
        domains: ["Data", "Finance"],
        levels: [],
        hiresPerYear: "some",
      }),
    ).toBe(true);
    expect(await saveRecruits(db, me, { domains: [], levels: [], hiresPerYear: null })).toBe(false);
    expect(
      await finishRecruiterProfile(db, me, { headline: "Je recrute en data", hiringNow: true }),
    ).toBe(true);
    const profile = await db.recruiterProfile.findUniqueOrThrow({ where: { userId: me } });
    expect(profile.domains).toEqual(["Data", "Finance"]);
    expect(profile.completedAt).toBeTruthy();
  });
});
