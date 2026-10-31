import { afterAll, describe, expect, it } from "vitest";
import { companyPage } from "@/server/services/explore";
import { respondDeclaredMember } from "@/server/services/org-team";
import {
  companyPagePreview,
  companyPageScreen,
  updateCompanyPage,
} from "@/server/services/org-page";
import type { HireContext } from "@/server/services/hire";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Étape 3 · A3 : Page entreprise. Seuls le propriétaire et les administrateurs la modifient ;
// l'aperçu ne montre que l'organisation de l'administrateur, ses membres et ses offres ouvertes.

const users: string[] = [];
const orgs: string[] = [];
const DAY = 86_400_000;

afterAll(async () => {
  await db.orgDeclaredMember.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.auditLog.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.experience.deleteMany({ where: { profile: { userId: { in: users } } } });
  await db.talentProfile.deleteMany({ where: { userId: { in: users } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function user() {
  const created = await newUser();
  users.push(created.id);
  return created;
}

async function company() {
  const owner = await user();
  const org = await newOrganization("company");
  orgs.push(org.id);
  const name = `Kasaï Pay ${org.id.slice(-6)} (fictive)`;
  await db.organization.update({ where: { id: org.id }, data: { name } });
  const ownerMembership = await db.membership.create({
    data: { userId: owner.id, organizationId: org.id, role: "org_owner" },
  });
  const recruiter = await user();
  const recruiterMembership = await db.membership.create({
    data: { userId: recruiter.id, organizationId: org.id, role: "recruiter", jobTitle: "RH" },
  });
  const ctx: HireContext = { userId: owner.id, organizationId: org.id, role: "org_owner" };
  return { org, name, ctx, owner, recruiter, ownerMembership, recruiterMembership };
}

async function job(organizationId: string, status: "published" | "draft") {
  return db.job.create({
    data: {
      organizationId,
      title: `Poste fictif ${status}`,
      slug: `test-${organizationId}-${Math.random().toString(36).slice(2)}`,
      description: "Offre fictive.",
      contractType: "cdi",
      remote: "onsite",
      city: "Kananga",
      country: "RD Congo",
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
  });
}

const page = {
  name: "Kasaï Pay (fictive)",
  sector: "Paiement mobile",
  size: "51-200",
  city: "Kananga",
  website: "kasaipay.example",
  description: "Entreprise fictive.",
  hiringNow: true,
};

describe("Page entreprise", () => {
  it("enregistre la page, avec le site complété et le badge, et le note au journal", async () => {
    const { ctx, org } = await company();
    expect(await updateCompanyPage(db, ctx, page)).toEqual({ ok: true });
    const saved = await db.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(saved.website).toBe("https://kasaipay.example");
    expect(saved.hiringNow).toBe(true);
    expect(saved.size).toBe("51-200");
    expect(
      await db.auditLog.count({ where: { organizationId: org.id, action: "org.page.update" } }),
    ).toBe(1);
    expect(await updateCompanyPage(db, ctx, { ...page, website: "pas un site" })).toEqual({
      ok: false,
      field: "website",
    });
    expect(await updateCompanyPage(db, ctx, { ...page, name: "K" })).toEqual({
      ok: false,
      field: "name",
    });
  });

  it("réserve la page aux administrateurs, et ne touche que leur organisation", async () => {
    const mine = await company();
    const other = await company();
    const recruiterCtx: HireContext = {
      userId: mine.recruiter.id,
      organizationId: mine.org.id,
      role: "recruiter",
    };
    await expect(updateCompanyPage(db, recruiterCtx, page)).rejects.toThrow("forbidden");
    await expect(updateCompanyPage(db, { ...recruiterCtx, role: "viewer" }, page)).rejects.toThrow(
      "forbidden",
    );
    await expect(companyPageScreen(db, recruiterCtx)).rejects.toThrow("forbidden");
    await updateCompanyPage(db, mine.ctx, page);
    const untouched = await db.organization.findUniqueOrThrow({ where: { id: other.org.id } });
    expect(untouched.name).toBe(other.name);
    expect(untouched.hiringNow).toBe(false);
  });

  it("propose le transfert de propriété au seul propriétaire", async () => {
    const { ctx, org, ownerMembership, recruiterMembership } = await company();
    const admin = await user();
    await db.membership.create({
      data: { userId: admin.id, organizationId: org.id, role: "org_admin" },
    });
    const screen = await companyPageScreen(db, ctx);
    expect(screen.transferTo?.map((member) => member.id)).toContain(recruiterMembership.id);
    expect(screen.transferTo?.map((member) => member.id)).not.toContain(ownerMembership.id);
    const asAdmin = await companyPageScreen(db, {
      userId: admin.id,
      organizationId: org.id,
      role: "org_admin",
    });
    expect(asAdmin.transferTo).toBeNull();
  });

  it("montre l'équipe, les personnes déclarées et les seules offres ouvertes de l'entreprise", async () => {
    const { ctx, org, name } = await company();
    const other = await company();
    const people: { id: string }[] = [];
    for (const visibility of ["recruiters", "recruiters", "recruiters", "private"] as const) {
      const person = await user();
      const profile = await db.talentProfile.create({ data: { userId: person.id, visibility } });
      people.push(
        await db.experience.create({
          data: {
            profileId: profile.id,
            title: "Poste fictif",
            company: name,
            startDate: new Date(Date.now() - 200 * DAY),
          },
        }),
      );
    }
    await respondDeclaredMember(db, ctx, people[0]!.id, true);
    await respondDeclaredMember(db, ctx, people[1]!.id, false);
    const open = await job(org.id, "published");
    await job(org.id, "draft");
    await job(other.org.id, "published");

    const preview = await companyPagePreview(db, ctx);
    // Propriétaire et recruteur : confirmés par l'entreprise.
    expect(preview.members.filter((member) => member.confirmed)).toHaveLength(3);
    const declared = preview.members.filter((member) =>
      people.some((experience) => experience.id === member.id),
    );
    // Confirmé, puis « Indiqué par la personne » ; ni « Ne travaille pas ici », ni profil privé.
    expect(declared.map((member) => [member.id, member.confirmed])).toEqual(
      expect.arrayContaining([
        [people[0]!.id, true],
        [people[2]!.id, false],
      ]),
    );
    expect(declared).toHaveLength(2);
    expect(preview.offers.map((offer) => offer.id)).toEqual([open.id]);
  });
});

describe("Page entreprise côté talent (étape 3, A6)", () => {
  // « Membres » (Ephraïm, 27/10/2026) : les recruteurs de l'entreprise seulement ; les personnes
  // qui disent y travailler restent hors de la page publique (src/server/services/explore.ts).
  it("montre l'équipe de recrutement seulement, jamais les personnes déclarées ni un anonyme", async () => {
    const { ctx, org, name } = await company();
    const people: { id: string; userId: string }[] = [];
    for (const visibility of ["recruiters", "recruiters", "recruiters", "anonymous"] as const) {
      const person = await user();
      const profile = await db.talentProfile.create({ data: { userId: person.id, visibility } });
      const experience = await db.experience.create({
        data: {
          profileId: profile.id,
          title: "Poste fictif",
          company: name,
          startDate: new Date(Date.now() - 200 * DAY),
        },
      });
      people.push({ id: experience.id, userId: person.id });
    }
    await respondDeclaredMember(db, ctx, people[0]!.id, true);
    await respondDeclaredMember(db, ctx, people[1]!.id, false);
    const reader = await user();
    const page = await companyPage(db, reader.id, org.slug);
    expect(page).not.toBeNull();
    const shown = new Map(page!.members.map((member) => [member.id, member.declared]));
    for (const person of people) expect(shown.has(person.userId)).toBe(false);
    expect(page!.members).toHaveLength(2);
    expect(page!.members.every((member) => !member.declared && member.role)).toBe(true);
    // L'administrateur ne voit pas non plus le nom d'un profil anonyme à confirmer.
    const pending = (await companyPageScreen(db, ctx)).pending;
    expect(pending.map((item) => item.experienceId)).toEqual([people[2]!.id]);
  });
});
