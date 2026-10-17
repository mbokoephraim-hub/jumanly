/**
 * E8 · Hire avancé et Companies: scope of the hiring manager and of a team recruiter, isolation of
 * the new tables, talent search quota, contact requests and consent, hidden scorecards, interviews
 * and verification.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate, usage } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { scorecardView, submitScorecard, visibleNotes } from "@/server/services/evaluation";
import {
  getOrgApplication,
  HireError,
  hireApplication,
  listOrgJobs,
  rejectApplication,
  type HireContext,
} from "@/server/services/hire";
import { buildReport } from "@/server/services/hire-reports";
import {
  answerInterview,
  cancelInterview,
  listInterviews,
  scheduleInterview,
} from "@/server/services/interviews";
import { assignJob, createTeam, setMemberTeam } from "@/server/services/org-structure";
import {
  addToPool,
  createContactRequest,
  createPool,
  getPool,
  listPools,
  respondContactRequest,
  searchTalents,
  viewTalentProfile,
} from "@/server/services/talent-search";
import { decideVerification, requestVerification } from "@/server/services/verification";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

/** An organization on a given plan, with its owner. */
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
  return member(organization.id, "org_owner");
}

async function member(organizationId: string, role: MembershipRole): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

async function job(ctx: HireContext, title = "Analyste fictif") {
  const created = await db.job.create({
    data: {
      organizationId: ctx.organizationId,
      slug: `test-${randomUUID()}`,
      title,
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
      closesAt: new Date(Date.now() + 30 * day),
      createdById: ctx.userId,
    },
  });
  return created.id;
}

/** A talent who chose to be visible, with a unique word in the headline to search for. */
async function talent(visibility: "recruiters" | "anonymous" | "private" = "recruiters") {
  const user = await newUser();
  users.push(user.id);
  const word = `zorglub${randomUUID().slice(0, 8)}`;
  const profile = await db.talentProfile.create({
    data: { userId: user.id, visibility, headline: `Analyste ${word}` },
  });
  return { userId: user.id, profileId: profile.id, word };
}

async function apply(jobId: string, userId: string) {
  const slug = (await db.job.findUniqueOrThrow({ where: { id: jobId } })).slug;
  const result = await applyToJob(db, { userId, jobSlug: slug });
  if (result.status !== "applied") throw new Error(result.status);
  return result.applicationId;
}

const message = "Bonjour, votre profil correspond à un poste fictif chez nous.";

describe("portée des offres (rôles avancés)", () => {
  it("un responsable du recrutement ne voit que les offres auxquelles il est ajouté", async () => {
    const owner = await company();
    const manager = await member(owner.organizationId, "hiring_manager");
    const mine = await job(owner, "Ajoutée");
    const other = await job(owner, "Pas ajoutée");
    await assignJob(db, owner, mine, { memberIds: [manager.userId] });
    const visible = (await listOrgJobs(db, manager)).map((item) => item.id);
    expect(visible).toContain(mine);
    expect(visible).not.toContain(other);
    const candidate = await talent();
    const applicationId = await apply(other, candidate.userId);
    await expect(getOrgApplication(db, manager, applicationId)).rejects.toMatchObject({
      code: "notFound",
    });
  });

  it("avec des droits avancés, un recruteur d'équipe voit les offres de son équipe", async () => {
    const owner = await company();
    const recruiter = await member(owner.organizationId, "recruiter");
    const team = await createTeam(db, owner, { name: "Équipe test", kind: "team" });
    const membership = await db.membership.findFirstOrThrow({
      where: { userId: recruiter.userId, organizationId: owner.organizationId },
    });
    await setMemberTeam(db, owner, membership.id, team.id);
    const ofTeam = await job(owner, "De l'équipe");
    const outside = await job(owner, "Hors équipe");
    await assignJob(db, owner, ofTeam, { teamId: team.id });
    const visible = (await listOrgJobs(db, recruiter)).map((item) => item.id);
    expect(visible).toContain(ofTeam);
    expect(visible).not.toContain(outside);
  });
});

describe("recherche de talents", () => {
  it("ne compte qu'une recherche par requête distincte, pages comprises", async () => {
    const owner = await company();
    const found = await talent();
    const hidden = await talent("private");
    const subject = { type: "organization" as const, id: owner.organizationId };
    const before = (await usage(db, subject, "hire.talent_search.monthly")).used;
    const first = await searchTalents(db, owner, { q: found.word });
    if (first.status !== "ok") throw new Error(first.status);
    expect(first.results.map((item) => item.profileId)).toEqual([found.profileId]);
    await searchTalents(db, owner, { q: found.word, page: "2" });
    await searchTalents(db, owner, { q: found.word });
    invalidate();
    expect((await usage(db, subject, "hire.talent_search.monthly")).used).toBe(before + 1);
    const none = await searchTalents(db, owner, { q: hidden.word });
    if (none.status !== "ok") throw new Error(none.status);
    expect(none.results).toHaveLength(0);
  });

  it("est fermée sans le droit (RH Free) et un profil anonyme reste anonyme", async () => {
    const free = await company("rh_free");
    expect((await searchTalents(db, free, { q: "x" })).status).toBe("locked");
    const owner = await company();
    const anonymous = await talent("anonymous");
    const result = await searchTalents(db, owner, { q: anonymous.word });
    if (result.status !== "ok") throw new Error(result.status);
    expect(result.results[0]).toMatchObject({ anonymous: true, name: null });
    const view = await viewTalentProfile(db, owner, anonymous.profileId);
    expect(view).toMatchObject({ status: "ok", anonymous: true, full: false });
  });
});

describe("demandes de mise en relation", () => {
  it("respecte le choix du talent : attente, refus, délai et blocage", async () => {
    const owner = await company();
    const person = await talent();
    const raw = { profile: person.profileId, message };
    expect((await createContactRequest(db, owner, { ...raw, message: "Court" })).status).toBe(
      "invalid",
    );
    const sent = await createContactRequest(db, owner, raw);
    if (sent.status !== "sent") throw new Error(sent.status);
    expect((await createContactRequest(db, owner, raw)).status).toBe("pending");
    // Nothing is exchanged before the answer.
    expect(
      await db.conversation.count({
        where: { organizationId: owner.organizationId, talentUserId: person.userId },
      }),
    ).toBe(0);
    expect((await respondContactRequest(db, person.userId, sent.requestId, "decline")).status).toBe(
      "declined",
    );
    expect((await createContactRequest(db, owner, raw)).status).toBe("cooldown");
    const later = new Date(Date.now() + 31 * day);
    const again = await createContactRequest(db, owner, raw, later);
    if (again.status !== "sent") throw new Error(again.status);
    expect((await respondContactRequest(db, person.userId, again.requestId, "block")).status).toBe(
      "blocked",
    );
    expect(
      (await createContactRequest(db, owner, raw, new Date(later.getTime() + 40 * day))).status,
    ).toBe("blocked");
  });

  it("accepter ouvre une conversation et le profil complet ; une autre organisation n'en voit rien", async () => {
    const owner = await company();
    const stranger = await company();
    const person = await talent("anonymous");
    const sent = await createContactRequest(db, owner, { profile: person.profileId, message });
    if (sent.status !== "sent") throw new Error(sent.status);
    // Another organization cannot answer for the talent, nor see the request.
    expect(
      (await respondContactRequest(db, stranger.userId, sent.requestId, "accept")).status,
    ).toBe("notFound");
    const accepted = await respondContactRequest(db, person.userId, sent.requestId, "accept");
    if (accepted.status !== "accepted") throw new Error(accepted.status);
    const conversation = await db.conversation.findUniqueOrThrow({
      where: { id: accepted.conversationId },
    });
    expect(conversation).toMatchObject({
      kind: "contact_request",
      organizationId: owner.organizationId,
    });
    expect(await viewTalentProfile(db, owner, person.profileId)).toMatchObject({
      status: "ok",
      full: true,
      anonymous: false,
    });
    expect(await viewTalentProfile(db, stranger, person.profileId)).toMatchObject({
      full: false,
      anonymous: true,
    });
  });

  it("un talent qui refuse les demandes ne peut pas être contacté", async () => {
    const owner = await company();
    const person = await talent();
    await db.talentProfile.update({
      where: { id: person.profileId },
      data: { acceptsContactRequests: false },
    });
    expect(
      (await createContactRequest(db, owner, { profile: person.profileId, message })).status,
    ).toBe("blocked");
  });
});

describe("viviers", () => {
  it("un vivier privé n'est visible que par son auteur, jamais par une autre organisation", async () => {
    const owner = await company();
    const colleague = await member(owner.organizationId, "recruiter");
    const stranger = await company();
    const person = await talent();
    const pool = await createPool(db, owner, { name: "Vivier test", visibility: "private" });
    await addToPool(db, owner, pool.id, person.profileId);
    expect((await getPool(db, owner, pool.id)).entries).toHaveLength(1);
    expect((await listPools(db, colleague)).map((item) => item.id)).not.toContain(pool.id);
    await expect(getPool(db, stranger, pool.id)).rejects.toBeInstanceOf(HireError);
    const shared = await createPool(db, owner, { name: "Vivier partagé", visibility: "org" });
    expect((await listPools(db, colleague)).map((item) => item.id)).toContain(shared.id);
    // Without `org.talent_pools.shared`, only private pools.
    const small = await company("company");
    await expect(
      createPool(db, small, { name: "Partagé", visibility: "org" }),
    ).rejects.toBeInstanceOf(HireError);
  });

  it("un talent redevenu privé disparaît du vivier, sauf s'il a postulé", async () => {
    const owner = await company();
    const person = await talent();
    const pool = await createPool(db, owner, { name: "Vivier test", visibility: "private" });
    await addToPool(db, owner, pool.id, person.profileId);
    await db.talentProfile.update({
      where: { id: person.profileId },
      data: { visibility: "private" },
    });
    expect((await getPool(db, owner, pool.id)).entries).toHaveLength(0);
  });
});

describe("grilles d'évaluation et notes", () => {
  it("les avis des autres restent masqués tant que l'on n'a pas évalué", async () => {
    const owner = await company();
    const colleague = await member(owner.organizationId, "org_admin");
    const jobId = await job(owner);
    const person = await talent();
    const applicationId = await apply(jobId, person.userId);
    const ratings = [{ name: "Analyse", rating: 4, comment: "" }];
    await submitScorecard(db, owner, applicationId, { recommendation: "yes", ratings });
    const application = { id: applicationId, job: { id: jobId, assignedToId: null } };
    const before = await scorecardView(db, colleague, application);
    expect(before).toMatchObject({ hidden: true, others: [], average: null, count: 1 });
    await submitScorecard(db, colleague, applicationId, { recommendation: "no", ratings });
    const after = await scorecardView(db, colleague, application);
    expect(after.hidden).toBe(false);
    expect(after.others).toHaveLength(1);
    const stranger = await company();
    await expect(
      submitScorecard(db, stranger, applicationId, { recommendation: "yes", ratings }),
    ).rejects.toBeInstanceOf(HireError);
  });

  it("sans collaboration, chacun ne voit que ses propres notes", async () => {
    const owner = await company("rh_pro");
    const events = [
      { type: "note", actorId: owner.userId },
      { type: "note", actorId: "someone-else" },
    ];
    expect(await visibleNotes(db, owner, events)).toHaveLength(1);
    const big = await company();
    expect(await visibleNotes(db, big, events)).toHaveLength(2);
  });
});

describe("entretiens", () => {
  it("le talent choisit un créneau ; une autre organisation ne voit pas l'entretien", async () => {
    const owner = await company();
    const stranger = await company();
    const jobId = await job(owner);
    const person = await talent();
    const applicationId = await apply(jobId, person.userId);
    const slot = new Date(Date.now() + 3 * day).toISOString().slice(0, 16);
    const input = {
      application: applicationId,
      mode: "video",
      duration: "45",
      slots: [slot],
      timezone: "UTC",
    };
    expect(
      (await scheduleInterview(db, owner, { ...input, slots: ["2020-01-01T10:00"] })).status,
    ).toBe("past");
    const sent = await scheduleInterview(db, owner, input);
    if (sent.status !== "sent") throw new Error(sent.status);
    expect(await listInterviews(db, stranger, { filter: "team" })).toHaveLength(0);
    const interview = await db.interview.findUniqueOrThrow({ where: { id: sent.interviewId } });
    await answerInterview(db, person.userId, interview.id, {
      answer: "accept",
      slot: interview.slots[0]!.toISOString(),
    });
    const confirmed = await db.interview.findUniqueOrThrow({ where: { id: interview.id } });
    expect(confirmed.status).toBe("confirmed");
    // Another talent cannot answer it.
    const other = await talent();
    await expect(
      answerInterview(db, other.userId, interview.id, { answer: "decline", message: "" }),
    ).rejects.toBeInstanceOf(HireError);
    await expect(cancelInterview(db, stranger, interview.id, "")).rejects.toBeInstanceOf(HireError);
  });

  it("propose encore un appel d'arrivée à un candidat retenu, jamais à un candidat refusé", async () => {
    // Prompt 5 bis, screen 80: « Ajouter un créneau » under an acceptance.
    const owner = await company();
    const jobId = await job(owner);
    const slot = new Date(Date.now() + 3 * day).toISOString().slice(0, 16);
    const input = { mode: "audio", duration: "30", slots: [slot], timezone: "UTC" };
    const hired = await apply(jobId, (await talent()).userId);
    await hireApplication(db, owner, hired, { messageSent: true });
    expect((await scheduleInterview(db, owner, { ...input, application: hired })).status).toBe(
      "sent",
    );
    const rejected = await apply(jobId, (await talent()).userId);
    await rejectApplication(db, owner, rejected, { reason: "otherCandidate", message: "" });
    expect((await scheduleInterview(db, owner, { ...input, application: rejected })).status).toBe(
      "invalid",
    );
  });

  it("est fermé sans le droit de rendez-vous", async () => {
    const free = await company("rh_free");
    const jobId = await job(free);
    const person = await talent();
    const applicationId = await apply(jobId, person.userId);
    const result = await scheduleInterview(db, free, {
      application: applicationId,
      mode: "video",
      duration: "30",
      slots: [new Date(Date.now() + 3 * day).toISOString().slice(0, 16)],
      timezone: "UTC",
    });
    expect(result.status).toBe("locked");
  });
});

describe("rapports et vérification", () => {
  it("chaque niveau de rapport ajoute ses sections", async () => {
    const range = { from: new Date(Date.now() - 30 * day), to: new Date() };
    const free = await company("rh_free");
    expect(await buildReport(db, free, range)).toMatchObject({ level: "basic", stats: null });
    const premium = await company("company_premium");
    const report = await buildReport(db, premium, range);
    expect(report.level).toBe("custom");
    expect(report.custom).not.toBeNull();
  });

  it("une demande de vérification passe par l'administration", async () => {
    const owner = await company();
    const admin = await newUser();
    users.push(admin.id);
    expect(
      await requestVerification(db, owner, { registration: "RCCM-FICTIF-1", mandate: "Gérante" }),
    ).toBe(true);
    expect(
      (await db.organization.findUniqueOrThrow({ where: { id: owner.organizationId } }))
        .verificationStatus,
    ).toBe("pending");
    expect(
      await decideVerification(db, admin.id, owner.organizationId, { decision: "reject" }),
    ).toBe(false);
    expect(
      await decideVerification(db, admin.id, owner.organizationId, { decision: "verify" }),
    ).toBe(true);
    const organization = await db.organization.findUniqueOrThrow({
      where: { id: owner.organizationId },
    });
    expect(organization.verificationStatus).toBe("verified");
    expect(organization.verifiedAt).not.toBeNull();
  });
});

beforeAll(() => invalidate());
