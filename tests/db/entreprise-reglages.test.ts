import { afterAll, describe, expect, it } from "vitest";
import { invalidate } from "@/server/entitlements";
import { ensureStages } from "@/server/services/applications";
import { scorecardCriteria } from "@/server/services/evaluation";
import type { HireContext } from "@/server/services/hire";
import { recordView } from "@/server/services/hire";
import { consultationJournal } from "@/server/services/org-journal";
import {
  recruitingSettings,
  saveSettingsTemplate,
  setCriterion,
  setStage,
} from "@/server/services/org-settings";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Étape 3 · A5 : Journal des consultations et Réglages du recrutement. Réservés au propriétaire et
// aux administrateurs ; chaque consultation est journalisée et ne se lit que dans son organisation.

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.messageTemplate.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.application.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.talentProfile.deleteMany({ where: { userId: { in: users } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function user(name = "Test Fictif") {
  const created = await newUser();
  users.push(created.id);
  return db.user.update({ where: { id: created.id }, data: { name } });
}

async function company() {
  const org = await newOrganization("company");
  orgs.push(org.id);
  const [owner, recruiter] = [await user("Joseph Fictif"), await user("Nadia Fictive")];
  await db.membership.createMany({
    data: [
      { userId: owner.id, organizationId: org.id, role: "org_owner" },
      { userId: recruiter.id, organizationId: org.id, role: "recruiter" },
    ],
  });
  const plan = await db.plan.findUniqueOrThrow({ where: { code: "company" } });
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: org.id,
      planId: plan.id,
      status: "active",
      source: "self",
      currentPeriodStart: new Date(Date.now() - 86_400_000),
      currentPeriodEnd: new Date(Date.now() + 20 * 86_400_000),
    },
  });
  invalidate();
  const ctx = (userId: string, role: HireContext["role"]): HireContext => ({
    userId,
    organizationId: org.id,
    role,
  });
  return { org, owner: ctx(owner.id, "org_owner"), recruiter: ctx(recruiter.id, "recruiter") };
}

async function job(organizationId: string) {
  return db.job.create({
    data: {
      organizationId,
      title: "Analyste fictif",
      slug: `test-${organizationId}-${Math.random().toString(36).slice(2)}`,
      description: "Offre fictive.",
      contractType: "cdi",
      remote: "onsite",
      city: "Kananga",
      country: "RD Congo",
      status: "published",
      publishedAt: new Date(),
    },
  });
}

async function application(organizationId: string, visibility: "recruiters" | "anonymous") {
  const talent = await user("Esther Fictive");
  const profile = await db.talentProfile.create({ data: { userId: talent.id, visibility } });
  const offer = await job(organizationId);
  const stages = await ensureStages(db, offer.id);
  const created = await db.application.create({
    data: { jobId: offer.id, profileId: profile.id, stageId: stages[0]!.id },
  });
  return { profile, offer, application: created };
}

describe("Journal des consultations", () => {
  it("journalise chaque consultation et la montre à l'administrateur, filtrée par membre", async () => {
    const { org, owner, recruiter } = await company();
    const { application: applied, offer } = await application(org.id, "recruiters");
    await recordView(db, recruiter, applied.id);
    expect(
      await db.auditLog.count({
        where: { organizationId: org.id, action: "profile.view", actorId: recruiter.userId },
      }),
    ).toBe(1);
    const journal = await consultationJournal(db, owner, null);
    expect(journal.rows).toHaveLength(1);
    expect(journal.rows[0]).toMatchObject({
      kind: "profile",
      person: "Esther Fictive",
      actorName: "Nadia Fictive",
      object: { kind: "job", title: offer.title },
      href: `/app/hire/candidats/${applied.id}`,
    });
    expect((await consultationJournal(db, owner, owner.userId)).rows).toHaveLength(0);
    expect((await consultationJournal(db, owner, recruiter.userId)).rows).toHaveLength(1);
  });

  it("refuse le journal au recruteur et au lecteur, et ne lit que l'organisation", async () => {
    const mine = await company();
    const other = await company();
    const { application: applied } = await application(other.org.id, "recruiters");
    await recordView(db, other.recruiter, applied.id);
    await expect(consultationJournal(db, mine.recruiter, null)).rejects.toThrow("forbidden");
    await expect(
      consultationJournal(db, { ...mine.recruiter, role: "viewer" }, null),
    ).rejects.toThrow("forbidden");
    expect((await consultationJournal(db, mine.owner, null)).rows).toHaveLength(0);
    // A member of another organization is never a filter.
    const filtered = await consultationJournal(db, mine.owner, other.recruiter.userId);
    expect(filtered.member).toBeNull();
    expect(filtered.rows).toHaveLength(0);
  });

  it("garde anonyme un profil anonyme vu dans la recherche de talents", async () => {
    const { org, owner, recruiter } = await company();
    const talent = await user("Rachel Fictive");
    const profile = await db.talentProfile.create({
      data: { userId: talent.id, visibility: "anonymous" },
    });
    await db.auditLog.create({
      data: {
        actorId: recruiter.userId,
        action: "profile.view",
        targetType: "talentProfile",
        targetId: profile.id,
        organizationId: org.id,
        metadata: { source: "talent_search" },
      },
    });
    const [row] = (await consultationJournal(db, owner, null)).rows;
    expect(row).toMatchObject({ kind: "profileVisible", person: null, anonymous: true });
  });
});

describe("Réglages du recrutement", () => {
  it("applique les étapes choisies aux nouvelles offres, sans toucher aux étapes fixes", async () => {
    const { org, owner } = await company();
    await setStage(db, owner, "examen", false);
    await setStage(db, owner, "test", true);
    await expect(setStage(db, owner, "recue", false)).rejects.toThrow("invalid");
    const settings = await recruitingSettings(db, owner);
    expect(settings.stages.filter((stage) => stage.on).map((stage) => stage.key)).toEqual([
      "recue",
      "preselection",
      "test",
      "entretien",
      "decision",
    ]);
    const offer = await job(org.id);
    const stages = await ensureStages(db, offer.id);
    expect(stages.map((stage) => stage.name)).toEqual([
      "Reçue",
      "Présélectionnée",
      "Test pratique",
      "Entretien",
      "Décision finale",
      "Retenue",
      "Non retenue",
    ]);
    expect(
      await db.auditLog.count({ where: { organizationId: org.id, action: "org.settings.stages" } }),
    ).toBe(2);
  });

  it("enregistre les modèles et la grille de l'organisation seulement", async () => {
    const mine = await company();
    const other = await company();
    await saveSettingsTemplate(db, mine.owner, "refus", "Non retenu", "Bonjour {prenom}, merci.");
    await saveSettingsTemplate(db, mine.owner, "refus", "Non retenu", "Bonjour {prenom}, encore.");
    expect(await db.messageTemplate.count({ where: { organizationId: mine.org.id } })).toBe(1);
    expect(await db.messageTemplate.count({ where: { organizationId: other.org.id } })).toBe(0);
    await expect(saveSettingsTemplate(db, mine.owner, "inconnu", "X", "Bonjour")).rejects.toThrow(
      "invalid",
    );

    await setCriterion(db, mine.owner, { add: "Communication" });
    await setCriterion(db, mine.owner, { add: "Travail en équipe" });
    await expect(setCriterion(db, mine.owner, { add: "communication" })).rejects.toThrow("invalid");
    await setCriterion(db, mine.owner, { remove: "Communication" });
    const org = await db.organization.findUniqueOrThrow({ where: { id: mine.org.id } });
    const criteria = scorecardCriteria(
      { scorecardTemplate: null, skills: [{ importance: "required", skill: { name: "SQL" } }] },
      org.scorecardCriteria,
    );
    expect(criteria.map((item) => item.name)).toEqual(["Travail en équipe"]);
    expect((await recruitingSettings(db, other.owner)).criteria).toEqual([]);
  });

  it("refuse les réglages au recruteur et au lecteur", async () => {
    const { recruiter } = await company();
    for (const ctx of [recruiter, { ...recruiter, role: "viewer" as const }]) {
      await expect(recruitingSettings(db, ctx)).rejects.toThrow("forbidden");
      await expect(setStage(db, ctx, "test", true)).rejects.toThrow("forbidden");
      await expect(saveSettingsTemplate(db, ctx, "refus", "X", "Bonjour")).rejects.toThrow(
        "forbidden",
      );
      await expect(setCriterion(db, ctx, { add: "Communication" })).rejects.toThrow("forbidden");
    }
  });
});
