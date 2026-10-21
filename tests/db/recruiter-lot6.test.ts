/**
 * Refonte recruteur, lot 6: the ATS with Orbi (credits, no automatic rejection), the list of the
 * retained and the grouped replies (with « Annuler »), the living messaging (clean-up, mute,
 * report), « Relancer » a proposal, the end-of-offer reminders and joining an existing
 * organization. Every reading stays inside the organization (golden rule n° 6).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { AI_CREDITS_KEY } from "@/server/ai";
import { consume, invalidate, usage } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { ensureApplicationConversation, sendMessage } from "@/server/services/connect";
import { HireError, publishJob, saveJob, type HireContext } from "@/server/services/hire";
import {
  atsBoard,
  CREDITS_PER_FILE,
  runAts,
  shortlist,
  startAts,
  unshortlist,
} from "@/server/services/hire-ats";
import { sendGroupReply, undoGroupReply } from "@/server/services/hire-group-replies";
import { groupReplyEmailPreview } from "@/server/services/hire-reply-preview";
import {
  cleanupCandidates,
  conversationAction,
  hideConversations,
} from "@/server/services/hire-messaging";
import { prolongJob, runEndingReminders } from "@/server/services/job-reminders";
import { createReport } from "@/server/services/moderation";
import {
  expireJoinRequests,
  joinCandidates,
  pendingJoinRequests,
  requestJoin,
  respondJoin,
} from "@/server/services/org-join";
import { remindProposal } from "@/server/services/talent-search";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.aiUsage.deleteMany({ where: { userId: { in: users } } });
  await db.report.deleteMany({ where: { reporterId: { in: users } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function member(organizationId: string, role: MembershipRole = "org_owner") {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  await db.user.update({ where: { id: user.id }, data: { aiConsentAt: new Date() } });
  return { userId: user.id, organizationId, role } satisfies HireContext;
}

/** A verified organization on a plan with the analysis, found by its right (never a plan name). */
async function company(name = `Organisation test ${randomUUID().slice(0, 8)}`) {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
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
    data: { verifiedAt: new Date(), name },
  });
  return member(organization.id);
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

async function applicant(jobId: string) {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({ where: { id: user.id }, data: { firstName: "Fictif" } });
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
  if (result.status !== "applied") throw new Error(result.status);
  return { userId: user.id, applicationId: result.applicationId };
}

const reply = (group: "retenus" | "non-retenus") => ({
  group,
  body: "Bonjour {prenom}, merci pour votre candidature au poste {poste}.",
  email: false,
  reviewed: true,
  strengthText: () => "",
  company: "Organisation test",
  signer: "Test Fictif",
});

describe("ATS avec Orbi : crédits, isolation, aucun rejet automatique", () => {
  it("analyse toutes les candidatures sans en écarter aucune", async () => {
    const owner = await company();
    const jobId = await publishedJob(owner);
    const files = [await applicant(jobId), await applicant(jobId), await applicant(jobId)];
    const started = await startAts(db, owner, jobId);
    expect(started.ok).toBe(true);
    await runAts(db, owner, jobId);
    const board = await atsBoard(db, owner, jobId);
    expect(board.rows).toHaveLength(3);
    // Orbi recommends; nobody is rejected, moved or told.
    const after = await db.application.findMany({
      where: { id: { in: files.map((file) => file.applicationId) } },
      select: { status: true, stage: { select: { kind: true } } },
    });
    expect(after.every((row) => row.status === "active" && row.stage.kind === "new")).toBe(true);
    expect(
      await db.applicationEvent.count({
        where: { applicationId: { in: files.map((f) => f.applicationId) }, type: "decision" },
      }),
    ).toBe(0);
    // A second launch has nothing left to read.
    expect(await startAts(db, owner, jobId)).toEqual({ ok: false, error: "nothing" });
  });

  it("ne lance rien quand les crédits ne suffisent pas", async () => {
    const owner = await company();
    const jobId = await publishedJob(owner);
    await applicant(jobId);
    await applicant(jobId);
    const subject = { type: "organization" as const, id: owner.organizationId };
    const credits = await usage(db, subject, AI_CREDITS_KEY);
    expect(credits.limit).toBeGreaterThan(CREDITS_PER_FILE);
    // One file's worth is left for two files: nothing starts, nothing is spent.
    await consume(db, subject, AI_CREDITS_KEY, credits.limit - credits.used - CREDITS_PER_FILE);
    invalidate();
    expect(await startAts(db, owner, jobId)).toEqual({ ok: false, error: "credits" });
    expect((await usage(db, subject, AI_CREDITS_KEY)).used).toBe(credits.limit - CREDITS_PER_FILE);
    // Everything spent: the analysis says the monthly quota is reached.
    await consume(db, subject, AI_CREDITS_KEY, CREDITS_PER_FILE);
    invalidate();
    expect(await startAts(db, owner, jobId)).toEqual({ ok: false, error: "quota" });
  });

  it("une autre organisation ne lit ni ne lance l'analyse", async () => {
    const owner = await company();
    const stranger = await company();
    const jobId = await publishedJob(owner);
    await applicant(jobId);
    await expect(atsBoard(db, stranger, jobId)).rejects.toBeInstanceOf(HireError);
    await expect(startAts(db, stranger, jobId)).rejects.toBeInstanceOf(HireError);
  });
});

describe("retenus et réponses groupées", () => {
  it("les retenus reçoivent un message, les autres la décision, et « Annuler » retire tout", async () => {
    const owner = await company();
    const stranger = await company();
    const jobId = await publishedJob(owner);
    const kept = await applicant(jobId);
    const other = await applicant(jobId);
    expect(await shortlist(db, owner, jobId, [kept.applicationId])).toBe(1);
    // Another organization cannot touch the list.
    await expect(shortlist(db, stranger, jobId, [other.applicationId])).rejects.toBeInstanceOf(
      HireError,
    );

    // Nothing leaves before the member has read it.
    expect(
      await sendGroupReply(db, owner, jobId, { ...reply("retenus"), reviewed: false }),
    ).toEqual({ ok: false, error: "reviewed" });
    const retained = await sendGroupReply(db, owner, jobId, reply("retenus"));
    expect(retained).toMatchObject({ ok: true, count: 1 });
    const message = await db.message.findFirstOrThrow({
      where: { conversation: { applicationId: kept.applicationId } },
    });
    expect(message.body).toContain("Bonjour Fictif");

    const others = await sendGroupReply(db, owner, jobId, reply("non-retenus"));
    expect(others).toMatchObject({ ok: true, count: 1 });
    expect(
      (await db.application.findUniqueOrThrow({ where: { id: other.applicationId } })).status,
    ).toBe("rejected");
    // The retained one is never in the rejected group.
    expect(
      (await db.application.findUniqueOrThrow({ where: { id: kept.applicationId } })).status,
    ).toBe("active");

    if (!retained.ok || !others.ok) return;
    expect(await undoGroupReply(db, owner, jobId, retained.batchId)).toBe("undone");
    expect(await undoGroupReply(db, owner, jobId, others.batchId)).toBe("undone");
    expect((await db.message.findUniqueOrThrow({ where: { id: message.id } })).hiddenAt).not.toBe(
      null,
    );
    expect(
      (await db.application.findUniqueOrThrow({ where: { id: other.applicationId } })).status,
    ).toBe("active");
    // After ten minutes nothing changes any more.
    const late = new Date(Date.now() + 11 * 60_000);
    const again = await sendGroupReply(db, owner, jobId, reply("non-retenus"));
    if (!again.ok) throw new Error(again.error);
    expect(await undoGroupReply(db, owner, jobId, again.batchId, late)).toBe("expired");
    expect(await unshortlist(db, owner, jobId, kept.applicationId)).toBe(true);
  });
});

describe("web lot 4 : aperçu de l'e-mail d'une réponse groupée", () => {
  it("rend l'e-mail tel qu'il part, sans rien envoyer, pour l'organisation de l'offre seulement", async () => {
    const owner = await company();
    const stranger = await company();
    const jobId = await publishedJob(owner);
    const kept = await applicant(jobId);
    expect(await shortlist(db, owner, jobId, [kept.applicationId])).toBe(1);
    const input = {
      jobId,
      group: "retenus" as const,
      ids: [],
      applicationId: kept.applicationId,
      // The greeting is the e-mail's own: the letter starts after it, as when it is sent.
      body: "Bonjour {prenom},\n\nMerci pour votre candidature au poste {poste}.",
      company: "Organisation test",
      strengthText: () => "",
    };
    const preview = await groupReplyEmailPreview(db, owner, input);
    expect(preview.html).toContain("Bonjour Fictif,");
    expect(preview.html).toContain("Merci pour votre candidature au poste Analyste fictif.");
    expect(preview.subject.length).toBeGreaterThan(0);
    // The talent's address is not in the preview, and nothing has left.
    const person = await db.user.findUniqueOrThrow({ where: { id: kept.userId } });
    expect(preview.html).not.toContain(person.email);
    expect(
      await db.message.count({ where: { conversation: { applicationId: kept.applicationId } } }),
    ).toBe(0);
    // Another organization cannot read it; a person outside the group is not previewed.
    await expect(groupReplyEmailPreview(db, stranger, input)).rejects.toBeInstanceOf(HireError);
    await expect(
      groupReplyEmailPreview(db, owner, { ...input, group: "non-retenus" }),
    ).rejects.toBeInstanceOf(HireError);
    expect(await unshortlist(db, owner, jobId, kept.applicationId)).toBe(true);
  });
});

describe("messagerie enrichie", () => {
  it("le nettoyage ne propose et ne retire que les conversations terminées des non retenus", async () => {
    const owner = await company();
    const stranger = await company();
    const jobId = await publishedJob(owner);
    const gone = await applicant(jobId);
    const live = await applicant(jobId);
    const old = new Date(Date.now() - 40 * day);
    const quiet = await ensureApplicationConversation(db, gone.applicationId);
    const active = await ensureApplicationConversation(db, live.applicationId);
    await db.application.update({
      where: { id: gone.applicationId },
      data: { status: "rejected" },
    });
    await db.conversation.updateMany({
      where: { id: { in: [quiet.id, active.id] } },
      data: { lastMessageAt: old },
    });
    expect((await cleanupCandidates(db, owner)).map((row) => row.id)).toEqual([quiet.id]);
    expect(await cleanupCandidates(db, stranger)).toEqual([]);
    expect(await hideConversations(db, owner, [quiet.id, active.id])).toBe(1);
    const rows = await db.conversation.findMany({ where: { id: { in: [quiet.id, active.id] } } });
    expect(rows.find((row) => row.id === quiet.id)!.orgHiddenAt).not.toBe(null);
    expect(rows.find((row) => row.id === active.id)!.orgHiddenAt).toBe(null);
    // Nothing is deleted, and a new message from the talent brings it back.
    await sendMessage(db, { userId: gone.userId }, quiet.id, { body: "Une question fictive." });
    expect((await db.conversation.findUniqueOrThrow({ where: { id: quiet.id } })).orgHiddenAt).toBe(
      null,
    );
  });

  it("couper les notifications : le message arrive, le membre n'est pas averti", async () => {
    const owner = await company();
    const jobId = await publishedJob(owner);
    const person = await applicant(jobId);
    const conversation = await ensureApplicationConversation(db, person.applicationId);
    await sendMessage(db, { userId: owner.userId, hire: owner }, conversation.id, {
      body: "Bonjour, une question fictive.",
    });
    const before = await sendMessage(db, { userId: person.userId }, conversation.id, {
      body: "Réponse fictive.",
    });
    expect(before.recipients).toContain(owner.userId);
    await conversationAction(db, owner, conversation.id, "mute");
    const after = await sendMessage(db, { userId: person.userId }, conversation.id, {
      body: "Autre réponse fictive.",
    });
    expect(after.recipients).not.toContain(owner.userId);
    await conversationAction(db, owner, conversation.id, "unmute");
    const back = await sendMessage(db, { userId: person.userId }, conversation.id, {
      body: "Encore une réponse fictive.",
    });
    expect(back.recipients).toContain(owner.userId);
  });

  it("un membre signale une conversation de son organisation, pas celle d'une autre", async () => {
    const owner = await company();
    const stranger = await company();
    const jobId = await publishedJob(owner);
    const person = await applicant(jobId);
    const conversation = await ensureApplicationConversation(db, person.applicationId);
    const input = { targetType: "conversation", targetId: conversation.id, reason: "spam" };
    expect(await createReport(db, owner.userId, input)).toBe("created");
    expect(await createReport(db, owner.userId, input)).toBe("already");
    expect(await createReport(db, stranger.userId, input)).toBe("notFound");
    await expect(conversationAction(db, stranger, conversation.id, "pin")).rejects.toBeInstanceOf(
      HireError,
    );
  });
});

describe("propositions : « Relancer »", () => {
  it("une seule relance, seulement par l'organisation qui a proposé", async () => {
    const owner = await company();
    const stranger = await company();
    const person = await applicant(await publishedJob(owner));
    const profile = await db.talentProfile.findUniqueOrThrow({ where: { userId: person.userId } });
    const request = await db.contactRequest.create({
      data: {
        organizationId: owner.organizationId,
        requesterId: owner.userId,
        profileId: profile.id,
        message: "Proposition fictive.",
        status: "pending",
        expiresAt: new Date(Date.now() + 14 * day),
      },
    });
    expect(await remindProposal(db, stranger, request.id)).toBe(false);
    expect(await remindProposal(db, owner, request.id)).toBe(true);
    expect(await remindProposal(db, owner, request.id)).toBe(false);
    expect(
      await db.notification.count({ where: { userId: person.userId, type: "contactRequest" } }),
    ).toBe(1);
  });
});

describe("rappels de fin d'offre", () => {
  it("J-3 est envoyé une fois ; prolonger efface les rappels et suit la nouvelle date", async () => {
    const owner = await company();
    const stranger = await company();
    const jobId = await publishedJob(owner);
    const now = new Date();
    await db.job.update({
      where: { id: jobId },
      data: { closesAt: new Date(now.getTime() + 3 * day), createdById: owner.userId },
    });
    const first = await runEndingReminders(db, now);
    expect(first.filter((mail) => mail.job.id === jobId).map((mail) => mail.to.id)).toEqual([
      owner.userId,
    ]);
    const second = await runEndingReminders(db, now);
    expect(second.filter((mail) => mail.job.id === jobId)).toEqual([]);
    expect(
      await db.notification.count({ where: { userId: owner.userId, type: "jobEnding" } }),
    ).toBe(1);

    await expect(prolongJob(db, stranger, jobId, { days: 14 })).rejects.toBeInstanceOf(HireError);
    const closesAt = await prolongJob(db, owner, jobId, { days: 14 }, now);
    expect(closesAt.getTime()).toBe(now.getTime() + 17 * day);
    const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.endingReminders).toEqual([]);
    // More than 180 days is refused.
    await expect(prolongJob(db, owner, jobId, { days: 200 }, now)).rejects.toBeInstanceOf(
      HireError,
    );
  });

  it("un membre qui a retiré J-3 de ses rappels n'est pas averti", async () => {
    const owner = await company();
    await db.user.update({ where: { id: owner.userId }, data: { endingReminders: ["d1"] } });
    const jobId = await publishedJob(owner);
    const now = new Date();
    await db.job.update({
      where: { id: jobId },
      data: { closesAt: new Date(now.getTime() + 3 * day), createdById: owner.userId },
    });
    const mails = await runEndingReminders(db, now);
    expect(mails.filter((mail) => mail.job.id === jobId)).toEqual([]);
  });
});

describe("rejoindre une organisation existante", () => {
  it("par le nom, avec l'accord d'un administrateur et le rôle choisi", async () => {
    const name = `Kivu Données ${randomUUID().slice(0, 6)} SARL`;
    const owner = await company(name);
    const recruiter = await member(owner.organizationId, "recruiter");
    const person = await newUser();
    users.push(person.id);
    const typed = name.replace(" SARL", "").toUpperCase();
    const found = await joinCandidates(db, {
      userId: person.id,
      email: person.email,
      orgName: typed,
    });
    expect(found.map((org) => org.id)).toEqual([owner.organizationId]);
    expect(found[0]!.matchedBy).toBe("name");
    const asked = await requestJoin(
      db,
      { userId: person.id, email: person.email, name: "Test Fictif", orgName: typed },
      owner.organizationId,
    );
    expect(asked.created).toBe(true);
    // A member who does not administer sees nothing and answers nothing.
    expect(await pendingJoinRequests(db, recruiter)).toBeNull();
    await expect(
      respondJoin(db, recruiter, asked.request.id, { accept: true }),
    ).rejects.toBeInstanceOf(HireError);
    const pending = await pendingJoinRequests(db, owner);
    expect(pending?.requests.map((row) => row.id)).toEqual([asked.request.id]);
    // Only the domain of the address is shown.
    expect(pending?.requests[0]!.domain).toBe("jumanly.test");

    await db.entitlementOverride.create({
      data: {
        subjectType: "organization",
        subjectId: owner.organizationId,
        key: "org.seats",
        value: "2",
        reason: "Test lot 6",
      },
    });
    invalidate();
    expect(await respondJoin(db, owner, asked.request.id, { accept: true, role: "viewer" })).toBe(
      "seats",
    );
    await db.entitlementOverride.updateMany({
      where: { subjectId: owner.organizationId, key: "org.seats" },
      data: { value: "10" },
    });
    invalidate();
    expect(await respondJoin(db, owner, asked.request.id, { accept: true, role: "viewer" })).toBe(
      "accepted",
    );
    const membership = await db.membership.findUniqueOrThrow({
      where: { userId_organizationId: { userId: person.id, organizationId: owner.organizationId } },
    });
    expect(membership).toMatchObject({ role: "viewer", status: "active" });
    // Once a member, the organization is no longer proposed.
    expect(
      await joinCandidates(db, { userId: person.id, email: person.email, orgName: typed }),
    ).toEqual([]);
  });

  it("une boîte gratuite ne rapproche jamais par le domaine ; sans réponse, la demande expire", async () => {
    const owner = await company(`Lualaba Conseil ${randomUUID().slice(0, 6)}`);
    const admin = await db.user.findUniqueOrThrow({ where: { id: owner.userId } });
    const person = await newUser();
    users.push(person.id);
    // Same domain as the administrator, but jumanly.test names no employer.
    expect(admin.email.endsWith("@jumanly.test")).toBe(true);
    expect(await joinCandidates(db, { userId: person.id, email: person.email })).toEqual([]);
    const orgName = (
      await db.organization.findUniqueOrThrow({ where: { id: owner.organizationId } })
    ).name;
    const asked = await requestJoin(
      db,
      { userId: person.id, email: person.email, name: "Test Fictif", orgName },
      owner.organizationId,
    );
    // Seven days later (only this request is moved back: the demo's own request stays).
    await db.orgJoinRequest.update({
      where: { id: asked.request.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await expireJoinRequests(db)).toBeGreaterThanOrEqual(1);
    expect(
      (await db.orgJoinRequest.findUniqueOrThrow({ where: { id: asked.request.id } })).status,
    ).toBe("expired");
    await expect(respondJoin(db, owner, asked.request.id, { accept: true })).rejects.toBeInstanceOf(
      HireError,
    );
  });
});
