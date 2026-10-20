/**
 * Refonte recruteur, lot 4: the planner's busy days, accepting the candidate's other date, the
 * team's questions, « À évaluer », the 1-to-4 evaluation, the talent search filters, « Mes
 * propositions », the pools at a glance and the call proposed with an acceptance. Every reading
 * stays inside the organization (golden rule n° 6).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { scorecardView, submitScorecard } from "@/server/services/evaluation";
import { HireError, type HireContext } from "@/server/services/hire";
import { decide, undoDecision } from "@/server/services/hire-candidates";
import {
  acceptProposedSlot,
  addInterviewQuestion,
  interviewsToEvaluate,
  plannerData,
  QUESTIONS_MAX,
  questionsOf,
  removeInterviewQuestion,
} from "@/server/services/hire-interviews";
import { answerInterview, scheduleInterview } from "@/server/services/interviews";
import {
  addToPool,
  createContactRequest,
  createPool,
  orgProposals,
  poolChoices,
  poolsOverview,
  searchTalents,
} from "@/server/services/talent-search";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.profileSkill.deleteMany({ where: { skill: { slug: { startsWith: "test-lot4-" } } } });
  await db.skill.deleteMany({ where: { slug: { startsWith: "test-lot4-" } } });
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function company(planCode = "company_plus") {
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
  await db.organization.update({
    where: { id: organization.id },
    data: { verifiedAt: new Date() },
  });
  return member(organization.id, "org_owner");
}

async function member(organizationId: string, role: MembershipRole): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

async function skill(name: string) {
  const slug = `test-lot4-${randomUUID().slice(0, 8)}`;
  return db.skill.create({ data: { slug, name: `${name} ${slug.slice(-8)}`, category: "test" } });
}

async function job(ctx: HireContext, skills: { id: string; required: boolean }[] = []) {
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
      skills: {
        create: skills.map((item) => ({
          skillId: item.id,
          importance: item.required ? "required" : "preferred",
          weight: item.required ? 5 : 2,
        })),
      },
    },
  });
  const stages = ["new", "screening", "interview", "offer", "hired", "rejected"] as const;
  await db.pipelineStage.createMany({
    data: stages.map((kind, order) => ({ jobId: created.id, order, kind, name: kind })),
  });
  return created.id;
}

async function talent(
  visibility: "recruiters" | "anonymous" | "private" = "recruiters",
  data: { skills?: string[]; years?: number; availability?: "open" | "listening" } = {},
) {
  const user = await newUser();
  users.push(user.id);
  const profile = await db.talentProfile.create({
    data: {
      userId: user.id,
      visibility,
      headline: "Analyste fictif",
      availability: data.availability ?? "listening",
      skills: { create: (data.skills ?? []).map((skillId) => ({ skillId, level: 3 })) },
      experiences: data.years
        ? {
            create: {
              title: "Poste fictif",
              company: "Entreprise fictive",
              startDate: new Date(Date.now() - data.years * 365 * day),
            },
          }
        : undefined,
    },
  });
  return { userId: user.id, profileId: profile.id };
}

async function apply(jobId: string, userId: string) {
  const slug = (await db.job.findUniqueOrThrow({ where: { id: jobId } })).slug;
  const result = await applyToJob(db, { userId, jobSlug: slug });
  if (result.status !== "applied") throw new Error(result.status);
  return result.applicationId;
}

const slotIn = (days: number, hour = 10) => {
  const date = new Date(Date.now() + days * day);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

async function invite(ctx: HireContext, applicationId: string, slots = [slotIn(3)]) {
  const sent = await scheduleInterview(db, ctx, {
    application: applicationId,
    mode: "video",
    duration: "45",
    slots,
    timezone: "UTC",
  });
  if (sent.status !== "sent") throw new Error(sent.status);
  return sent.interviewId;
}

describe("proposer un entretien : la journée de l'équipe", () => {
  it("ne lit que les entretiens de l'organisation, et seulement pour qui gère", async () => {
    const owner = await company();
    const stranger = await company();
    const person = await talent();
    const applicationId = await apply(await job(owner), person.userId);
    await invite(owner, applicationId, [slotIn(3, 9)]);
    // An interview of another organization at the same time is not « busy » here.
    const otherApplication = await apply(await job(stranger), (await talent()).userId);
    await invite(stranger, otherApplication, [slotIn(3, 14)]);
    const data = await plannerData(db, owner, applicationId, "UTC");
    const key = slotIn(3).slice(0, 10);
    expect(data.busy[key]).toHaveLength(1);
    expect(data.busy[key]![0]).toMatchObject({ start: 540, tentative: true });
    await expect(plannerData(db, stranger, applicationId, "UTC")).rejects.toBeInstanceOf(HireError);
    const reader = await member(owner.organizationId, "hiring_manager");
    await expect(plannerData(db, reader, applicationId, "UTC")).rejects.toBeInstanceOf(HireError);
  });
});

describe("autre date proposée par le candidat", () => {
  it("le recruteur accepte une date que le talent a écrite, jamais une autre", async () => {
    const owner = await company();
    const stranger = await company();
    const person = await talent();
    const applicationId = await apply(await job(owner), person.userId);
    const interviewId = await invite(owner, applicationId);
    await answerInterview(db, person.userId, interviewId, {
      answer: "propose",
      slots: [slotIn(5, 11)],
      message: "",
    });
    const proposed = await db.interview.findUniqueOrThrow({ where: { id: interviewId } });
    const slot = proposed.proposedSlots[0]!.toISOString();
    await expect(
      acceptProposedSlot(db, owner, interviewId, new Date(Date.now() + 9 * day).toISOString()),
    ).rejects.toBeInstanceOf(HireError);
    await expect(acceptProposedSlot(db, stranger, interviewId, slot)).rejects.toBeInstanceOf(
      HireError,
    );
    await acceptProposedSlot(db, owner, interviewId, slot);
    const confirmed = await db.interview.findUniqueOrThrow({ where: { id: interviewId } });
    expect(confirmed).toMatchObject({ status: "confirmed", proposedSlots: [] });
    expect(confirmed.startsAt?.toISOString()).toBe(slot);
    expect(
      await db.notification.count({ where: { userId: person.userId, type: "interviewAccepted" } }),
    ).toBe(1);
    // Accepted once: not twice.
    await expect(acceptProposedSlot(db, owner, interviewId, slot)).rejects.toBeInstanceOf(
      HireError,
    );
  });
});

describe("préparer l'entretien : les questions de l'équipe", () => {
  it("refuse une question sur la vie privée ; seul l'auteur retire la sienne", async () => {
    const owner = await company();
    const colleague = await member(owner.organizationId, "org_admin");
    const stranger = await company();
    const applicationId = await apply(await job(owner), (await talent()).userId);
    const interviewId = await invite(owner, applicationId);
    expect(await addInterviewQuestion(db, owner, interviewId, "Êtes-vous marié ?")).toBe(
      "protected",
    );
    expect(await addInterviewQuestion(db, owner, interviewId, "Ok")).toBe("invalid");
    expect(
      await addInterviewQuestion(db, owner, interviewId, "Comment priorisez-vous vos demandes ?"),
    ).toBe("added");
    await expect(
      addInterviewQuestion(db, stranger, interviewId, "Une question d'ailleurs ?"),
    ).rejects.toBeInstanceOf(HireError);
    const [question] = questionsOf(
      (await db.interview.findUniqueOrThrow({ where: { id: interviewId } })).questions,
    );
    await expect(
      removeInterviewQuestion(db, colleague, interviewId, question!.id),
    ).rejects.toBeInstanceOf(HireError);
    await removeInterviewQuestion(db, owner, interviewId, question!.id);
    for (let index = 0; index < QUESTIONS_MAX; index += 1)
      await addInterviewQuestion(db, owner, interviewId, `Question fictive numéro ${index}`);
    expect(await addInterviewQuestion(db, owner, interviewId, "Une de trop, fictive")).toBe("full");
  });
});

describe("à évaluer et évaluation sur 4", () => {
  it("un entretien passé attend l'évaluation de ses participants, sur 4, avec « Hésitation »", async () => {
    const owner = await company();
    const stranger = await company();
    const applicationId = await apply(await job(owner), (await talent()).userId);
    const interviewId = await invite(owner, applicationId);
    await db.interview.update({
      where: { id: interviewId },
      data: { status: "confirmed", startsAt: new Date(Date.now() - day) },
    });
    expect((await interviewsToEvaluate(db, owner)).map((item) => item.id)).toContain(interviewId);
    expect(await interviewsToEvaluate(db, stranger)).toHaveLength(0);
    await expect(
      submitScorecard(db, owner, applicationId, {
        recommendation: "maybe",
        ratings: [{ name: "Analyse", rating: 5, comment: "" }],
      }),
    ).rejects.toBeInstanceOf(HireError);
    await submitScorecard(db, owner, applicationId, {
      recommendation: "maybe",
      ratings: [{ name: "Analyse", rating: 4, comment: "" }],
    });
    const application = await db.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { job: { select: { id: true, assignedToId: true } } },
    });
    expect((await scorecardView(db, owner, application)).mine?.recommendation).toBe("maybe");
    expect((await interviewsToEvaluate(db, owner)).map((item) => item.id)).not.toContain(
      interviewId,
    );
  });
});

describe("rechercher des talents : filtres autorisés", () => {
  it("filtre par compétence et niveau d'expérience, jamais sur un profil privé", async () => {
    const owner = await company();
    const sql = await skill("SQL");
    const junior = await talent("recruiters", { skills: [sql.id], years: 2 });
    const senior = await talent("recruiters", { skills: [sql.id], years: 6 });
    const hidden = await talent("private", { skills: [sql.id], years: 2 });
    const all = await searchTalents(db, owner, { skills: sql.name });
    if (all.status !== "ok") throw new Error(all.status);
    const ids = all.results.map((item) => item.profileId);
    expect(ids).toEqual(expect.arrayContaining([junior.profileId, senior.profileId]));
    expect(ids).not.toContain(hidden.profileId);
    const level = await searchTalents(db, owner, { skills: sql.name, level: "junior" });
    if (level.status !== "ok") throw new Error(level.status);
    expect(level.results.map((item) => item.profileId)).toEqual([junior.profileId]);
  });
});

describe("mes propositions et viviers", () => {
  it("chaque organisation ne voit que ses propositions et ses viviers", async () => {
    const owner = await company();
    const stranger = await company();
    const sql = await skill("SQL");
    await job(owner, [{ id: sql.id, required: true }]);
    const person = await talent("anonymous", { skills: [sql.id], availability: "open" });
    const sent = await createContactRequest(db, owner, {
      profile: person.profileId,
      message: "Bonjour, votre profil correspond à un poste fictif chez nous.",
    });
    expect(sent.status).toBe("sent");
    const rows = await orgProposals(db, owner);
    expect(rows).toHaveLength(1);
    // An anonymous talent keeps a hidden name until they accept.
    expect(rows[0]).toMatchObject({ status: "pending", name: null, profileId: person.profileId });
    expect(await orgProposals(db, stranger)).toHaveLength(0);

    const pool = await createPool(db, owner, { name: "Vivier test", visibility: "private" });
    expect((await poolChoices(db, owner, person.profileId))?.[0]).toMatchObject({ has: false });
    await addToPool(db, owner, pool.id, person.profileId);
    expect((await poolChoices(db, owner, person.profileId))?.[0]).toMatchObject({
      id: pool.id,
      has: true,
      count: 1,
    });
    const overview = await poolsOverview(db, owner);
    expect(overview.pools[0]).toMatchObject({ id: pool.id, count: 1, available: 1, fits: 1 });
    expect(overview.suggestion).toMatchObject({ poolId: pool.id, count: 1 });
    expect((await poolsOverview(db, stranger)).pools).toHaveLength(0);
    // Without `hire.shortlist`, no pool to choose.
    expect(await poolChoices(db, await company("rh_free"), person.profileId)).toBeNull();
  });
});

describe("décision « Retenu » avec un appel d'arrivée", () => {
  it("crée l'appel avec la décision, refuse une heure passée et l'annule avec « Annuler »", async () => {
    const owner = await company();
    const applicationId = await apply(await job(owner), (await talent()).userId);
    const decision = {
      outcome: "hired" as const,
      message: "Bonjour, votre candidature est retenue. Choisissez un créneau ci-dessous.",
      company: "Organisation test",
      signer: "Test Fictif",
    };
    await expect(
      decide(db, owner, applicationId, {
        ...decision,
        call: { slots: ["2020-01-01T10:00"], timezone: "UTC" },
      }),
    ).rejects.toBeInstanceOf(HireError);
    expect((await db.application.findUniqueOrThrow({ where: { id: applicationId } })).status).toBe(
      "active",
    );
    const now = new Date();
    await decide(
      db,
      owner,
      applicationId,
      { ...decision, call: { slots: [slotIn(4)], timezone: "UTC" } },
      now,
    );
    const call = await db.interview.findFirstOrThrow({ where: { applicationId } });
    expect(call).toMatchObject({ mode: "audio", durationMinutes: 30, status: "pending" });
    expect(await undoDecision(db, owner, applicationId, new Date(now.getTime() + 60_000))).toBe(
      "undone",
    );
    expect((await db.interview.findUniqueOrThrow({ where: { id: call.id } })).status).toBe(
      "canceled",
    );
  });
});
