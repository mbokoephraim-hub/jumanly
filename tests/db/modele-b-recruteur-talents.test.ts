/**
 * Modèle B recruteur, M6: the tab Talents of the phone. « Découvrir » and the search show only
 * talents who made their profile visible, never the company's own members (discreet profile);
 * hiding a suggestion is one member's choice; a profile is shared only with a member of the same
 * company; a proposal reads « Vue » once the talent saw it; every opening is logged.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { HireError, type HireContext } from "@/server/services/hire";
import {
  hideSuggestion,
  rhDiscover,
  rhProposals,
  rhSearchTalents,
  shareTalent,
} from "@/server/services/hire-phone-talents";
import { createReport } from "@/server/services/moderation";
import {
  createContactRequest,
  talentContactRequests,
  viewTalentProfile,
} from "@/server/services/talent-search";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const skills: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.profileSkill.deleteMany({ where: { skillId: { in: skills } } });
  await db.skill.deleteMany({ where: { id: { in: skills } } });
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function member(organizationId: string, role: MembershipRole): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

/** A company on a plan that opens the talent search, the vivier and explained scores. */
async function company(planCode = "rh_premium") {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  const plan = await db.plan.findUniqueOrThrow({ where: { code: planCode } });
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

async function jobWith(ctx: HireContext, skillId: string) {
  const created = await db.job.create({
    data: {
      organizationId: ctx.organizationId,
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
      createdById: ctx.userId,
      skills: { create: { skillId, importance: "required" } },
    },
  });
  return created.id;
}

async function talent(
  skillId: string,
  visibility: "recruiters" | "anonymous" | "private" = "recruiters",
  userId?: string,
) {
  const id: string = userId ?? (await newUser()).id;
  if (!userId) users.push(id);
  await db.user.update({ where: { id }, data: { city: "Goma" } });
  const profile = await db.talentProfile.create({
    data: {
      userId: id,
      visibility,
      headline: "Analyste de données fictif",
      skills: { create: { skillId, level: 3 } },
    },
  });
  return { userId: id, profileId: profile.id };
}

describe("Talents du recruteur au téléphone", () => {
  let a: HireContext;
  let colleague: HireContext;
  let b: HireContext;
  let skillId: string;
  let skillName: string;
  let visible: { userId: string; profileId: string };
  let hiddenProfile: { userId: string; profileId: string };
  let colleagueProfile: { userId: string; profileId: string };

  beforeAll(async () => {
    skillName = `Zorglub ${randomUUID().slice(0, 8)}`;
    const skill = await db.skill.create({
      data: { name: skillName, slug: `zorglub-${randomUUID()}`, category: "test" },
    });
    skills.push(skill.id);
    skillId = skill.id;
    a = await company();
    colleague = await member(a.organizationId, "recruiter");
    b = await company();
    await jobWith(a, skillId);
    await jobWith(b, skillId);
    visible = await talent(skillId);
    hiddenProfile = await talent(skillId, "private");
    // A recruiter of A who is also a visible talent: never suggested to their own company.
    colleagueProfile = await talent(skillId, "recruiters", colleague.userId);
  });

  it("Découvrir ne montre que les talents visibles, jamais un membre de l'entreprise", async () => {
    const found = await rhDiscover(db, a, null);
    if (found.status !== "ok") throw new Error(found.status);
    const ids = found.cards.map((card) => card.profileId);
    expect(ids).toContain(visible.profileId);
    expect(ids).not.toContain(hiddenProfile.profileId);
    expect(ids).not.toContain(colleagueProfile.profileId);
    // Company B sees the colleague of A: they are not B's member.
    const other = await rhDiscover(db, b, null);
    if (other.status !== "ok") throw new Error(other.status);
    expect(other.cards.map((card) => card.profileId)).toContain(colleagueProfile.profileId);
    // An offer of another company is refused.
    const jobOfB = await db.job.findFirstOrThrow({ where: { organizationId: b.organizationId } });
    await expect(rhDiscover(db, a, jobOfB.id)).rejects.toThrow(HireError);
  });

  it("sans le droit de recherche, Découvrir est fermé", async () => {
    const free = await company("rh_free");
    expect((await rhDiscover(db, free, null)).status).toBe("locked");
    expect(await rhSearchTalents(db, free, skillName, "competence")).toEqual([]);
  });

  it("masquer une suggestion vaut pour ce membre seulement, la recherche le trouve encore", async () => {
    await hideSuggestion(db, a, visible.profileId);
    const mine = await rhDiscover(db, a, null);
    const theirs = await rhDiscover(db, { ...colleague, role: "recruiter" }, null);
    if (mine.status !== "ok" || theirs.status !== "ok") throw new Error("locked");
    expect(mine.cards.map((card) => card.profileId)).not.toContain(visible.profileId);
    expect(theirs.cards.map((card) => card.profileId)).toContain(visible.profileId);
    const searched = await rhSearchTalents(db, a, skillName, "competence");
    expect(searched.map((row) => row.profileId)).toContain(visible.profileId);
    await expect(hideSuggestion(db, a, hiddenProfile.profileId)).rejects.toThrow(HireError);
  });

  it("la recherche ignore les profils privés, anonymes et les membres de l'entreprise", async () => {
    const anonymous = await talent(skillId, "anonymous");
    const rows = await rhSearchTalents(db, a, skillName, "competence");
    const ids = rows.map((row) => row.profileId);
    expect(ids).not.toContain(hiddenProfile.profileId);
    expect(ids).not.toContain(anonymous.profileId);
    expect(ids).not.toContain(colleagueProfile.profileId);
    expect((await rhSearchTalents(db, a, "Goma", "ville")).map((row) => row.profileId)).toContain(
      visible.profileId,
    );
  });

  it("ouvrir un profil est journalisé", async () => {
    const before = await db.auditLog.count({
      where: { action: "profile.view", actorId: a.userId, targetId: visible.profileId },
    });
    const view = await viewTalentProfile(db, a, visible.profileId);
    expect(view.status).toBe("ok");
    expect(
      await db.auditLog.count({
        where: { action: "profile.view", actorId: a.userId, targetId: visible.profileId },
      }),
    ).toBe(before + 1);
    expect((await viewTalentProfile(db, a, hiddenProfile.profileId)).status).toBe("notFound");
  });

  it("partager un profil ne va qu'à un membre de la même entreprise", async () => {
    await expect(shareTalent(db, a, visible.profileId, b.userId)).rejects.toThrow(HireError);
    await expect(shareTalent(db, a, visible.profileId, a.userId)).rejects.toThrow(HireError);
    await expect(shareTalent(db, a, hiddenProfile.profileId, colleague.userId)).rejects.toThrow(
      HireError,
    );
    await shareTalent(db, a, visible.profileId, colleague.userId);
    expect(
      await db.notification.count({ where: { userId: colleague.userId, type: "talentShared" } }),
    ).toBe(1);
  });

  it("une proposition passe à « Vue » quand le talent l'a vue, et reste à son entreprise", async () => {
    const sent = await createContactRequest(db, a, {
      profile: visible.profileId,
      job: "",
      message: "Bonjour, votre profil correspond à un poste fictif chez nous.",
    });
    expect(sent.status).toBe("sent");
    expect((await rhProposals(db, a))[0]!.state).toBe("waiting");
    expect(await rhProposals(db, b)).toEqual([]);
    await talentContactRequests(db, visible.userId);
    expect((await rhProposals(db, a))[0]!.state).toBe("seen");
  });

  it("un recruteur peut signaler un profil visible, jamais un profil privé", async () => {
    expect(
      await createReport(db, a.userId, {
        targetType: "profile",
        targetId: visible.profileId,
        reason: "spam",
      }),
    ).not.toBe("notFound");
    expect(
      await createReport(db, a.userId, {
        targetType: "profile",
        targetId: hiddenProfile.profileId,
        reason: "spam",
      }),
    ).toBe("notFound");
  });
});
