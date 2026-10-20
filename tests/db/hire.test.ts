import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob, listApplications } from "@/server/services/applications";
import {
  ConnectError,
  ensureApplicationConversation,
  getConversation,
  listConversations,
  sendMessage,
} from "@/server/services/connect";
import {
  addNote,
  closeJob,
  getOrgApplication,
  getOrgJob,
  getPipeline,
  HireError,
  hireDashboard,
  listOrgJobs,
  moveApplication,
  publishJob,
  recordView,
  rejectApplication,
  saveJob,
  type HireContext,
} from "@/server/services/hire";
import {
  acceptInvitation,
  changeRole,
  inviteMembers,
  removeMember,
  revokeInvitation,
} from "@/server/services/organization";
import {
  addReportNote,
  closeReport,
  createReport,
  messageContext,
  moderationQueue,
  reportNotes,
  requestJobChanges,
} from "@/server/services/moderation";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.invitation.deleteMany({ where: { organizationId: { in: orgs } } });
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

/** A verified organization: its offers publish at once (brief recruteur § 2.11). */
async function org() {
  const organization = await newOrganization("recruiter");
  orgs.push(organization.id);
  return db.organization.update({
    where: { id: organization.id },
    data: { verifiedAt: new Date() },
  });
}

const form = (title = "Comptable fictif") => ({
  title,
  contractType: "cdi",
  remote: "onsite",
  city: "Kinshasa",
  country: "Congo-Kinshasa",
  salaryMin: "",
  salaryMax: "",
  closesAt: "",
  description: "Tenue de la comptabilité d'une structure fictive.",
  responsibilities: "Saisir les factures\nPréparer les rapprochements",
  requirements: "",
  benefits: "",
  experienceMin: "1",
  requiredSkills: "Comptabilité",
  preferredSkills: "Excel",
  knockout: "",
  rejectionTemplate: "",
});

async function publishedJob(ctx: HireContext, title?: string) {
  const saved = await saveJob(db, ctx, form(title));
  if (!saved.ok) throw new Error(saved.error + JSON.stringify(saved));
  const published = await publishJob(db, ctx, saved.jobId);
  expect(published.status).toBe("published");
  return saved.jobId;
}

async function applicant(jobId: string) {
  const user = await newUser();
  users.push(user.id);
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
  if (result.status !== "applied") throw new Error(result.status);
  return { userId: user.id, applicationId: result.applicationId };
}

// Partie 10 § 10.2: automatic tests that try to reach another organization's data.
describe("isolation entre organisations (règle d'or n° 6)", () => {
  let a: HireContext;
  let b: HireContext;
  let jobB: string;
  let applicationB: string;
  let conversationB: string;
  let stageB: string;

  beforeAll(async () => {
    a = await member((await org()).id);
    b = await member((await org()).id);
    await db.subscription.deleteMany({
      where: { subjectId: { in: [a.organizationId, b.organizationId] } },
    });
    jobB = await publishedJob(b);
    applicationB = (await applicant(jobB)).applicationId;
    conversationB = (await ensureApplicationConversation(db, applicationB)).id;
    stageB = (
      await db.pipelineStage.findFirstOrThrow({ where: { jobId: jobB, kind: "screening" } })
    ).id;
  });

  const notFound = (promise: Promise<unknown>) =>
    expect(promise).rejects.toMatchObject({ code: "notFound" });

  it("les offres de B sont introuvables pour A", async () => {
    await notFound(getOrgJob(db, a, jobB));
    await notFound(saveJob(db, a, form("Détournée"), jobB));
    await notFound(publishJob(db, a, jobB));
    await notFound(closeJob(db, a, jobB));
    await notFound(getPipeline(db, a, jobB));
    expect((await listOrgJobs(db, a)).map((job) => job.id)).not.toContain(jobB);
    expect((await hireDashboard(db, a)).applications).toBe(0);
    expect((await db.job.findUniqueOrThrow({ where: { id: jobB } })).title).toBe(
      "Comptable fictif",
    );
  });

  it("les candidatures de B sont introuvables pour A", async () => {
    await notFound(getOrgApplication(db, a, applicationB));
    await notFound(recordView(db, a, applicationB));
    await notFound(moveApplication(db, a, applicationB, stageB));
    await notFound(rejectApplication(db, a, applicationB, { reason: "other", message: "" }));
    await notFound(addNote(db, a, applicationB, "Note détournée"));
    const application = await db.application.findUniqueOrThrow({ where: { id: applicationB } });
    expect(application.viewedAt).toBeNull();
    expect(application.status).toBe("active");
  });

  it("A ne peut pas déplacer sa candidature vers une étape de B", async () => {
    const jobA = await publishedJob(a, "Offre de A");
    const { applicationId } = await applicant(jobA);
    await notFound(moveApplication(db, a, applicationId, stageB));
  });

  it("les conversations de B sont introuvables pour A", async () => {
    const viewer = { userId: a.userId, hire: a };
    expect((await listConversations(db, viewer)).map((item) => item.id)).not.toContain(
      conversationB,
    );
    await expect(getConversation(db, viewer, conversationB)).rejects.toBeInstanceOf(ConnectError);
    await expect(
      sendMessage(db, viewer, conversationB, { body: "Intrusion" }),
    ).rejects.toBeInstanceOf(ConnectError);
    // The talent of A's own space cannot read it either.
    await expect(getConversation(db, { userId: a.userId }, conversationB)).rejects.toBeInstanceOf(
      ConnectError,
    );
  });

  it("les membres et invitations de B sont hors de portée de A", async () => {
    const other = await member(b.organizationId, "recruiter");
    const membership = await db.membership.findFirstOrThrow({ where: { userId: other.userId } });
    await notFound(removeMember(db, a, membership.id));
    await notFound(changeRole(db, a, membership.id, "recruiter"));
    const invitation = await db.invitation.create({
      data: {
        organizationId: b.organizationId,
        email: `x-${randomUUID()}@jumanly.test`,
        role: "recruiter",
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    await notFound(revokeInvitation(db, a, invitation.id));
  });
});

describe("rôles", () => {
  it("un responsable du recrutement évalue mais ne publie pas ; un lecteur ne voit pas les candidatures", async () => {
    const owner = await member((await org()).id);
    const jobId = await publishedJob(owner);
    const { applicationId } = await applicant(jobId);
    const manager = await member(owner.organizationId, "hiring_manager");
    const viewer = await member(owner.organizationId, "viewer");
    await expect(saveJob(db, manager, form())).rejects.toMatchObject({ code: "forbidden" });
    await expect(publishJob(db, manager, jobId)).rejects.toBeInstanceOf(HireError);
    // A hiring manager only sees the jobs they are added to (E8).
    await expect(addNote(db, manager, applicationId, "Avant ajout.")).rejects.toMatchObject({
      code: "notFound",
    });
    await db.jobAssignment.create({ data: { jobId, userId: manager.userId } });
    await addNote(db, manager, applicationId, "Bonne lettre.");
    await expect(getOrgApplication(db, viewer, applicationId)).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});

describe("offres", () => {
  it("respecte la limite d'offres actives du forfait (RH Free : 1)", async () => {
    const ctx = await member((await org()).id);
    await publishedJob(ctx, "Première");
    const second = await saveJob(db, ctx, form("Deuxième"));
    if (!second.ok) throw new Error();
    expect(await publishJob(db, ctx, second.jobId)).toMatchObject({ status: "limit", max: 1 });
    expect((await db.job.findUniqueOrThrow({ where: { id: second.jobId } })).status).toBe("draft");
  });

  it("envoie en vérification une offre qui demande un paiement", async () => {
    const ctx = await member((await org()).id);
    const saved = await saveJob(db, ctx, {
      ...form(),
      description: "Frais de dossier de 20 USD à payer avant l'entretien.",
    });
    if (!saved.ok) throw new Error();
    expect(await publishJob(db, ctx, saved.jobId)).toMatchObject({ status: "pending_review" });
    const job = await db.job.findUniqueOrThrow({ where: { id: saved.jobId } });
    expect(job.moderationFlags).toContain("payment");
  });

  it("refuse un critère éliminatoire portant sur une donnée protégée", async () => {
    const ctx = await member((await org()).id);
    expect(
      await saveJob(db, ctx, { ...form(), knockout: "Homme de moins de 30 ans" }),
    ).toMatchObject({ ok: false, error: "forbidden" });
  });

  it("signale les compétences inconnues du référentiel", async () => {
    const ctx = await member((await org()).id);
    const result = await saveJob(db, ctx, {
      ...form(),
      requiredSkills: "Compétence inexistante xyz",
    });
    expect(result).toMatchObject({
      ok: false,
      error: "unknownSkills",
      unknownSkills: ["Compétence inexistante xyz"],
    });
  });
});

describe("pipeline", () => {
  it("journalise la consultation, garde l'historique et cache les notes au talent", async () => {
    const ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    const { userId, applicationId } = await applicant(jobId);
    await recordView(db, ctx, applicationId);
    expect(
      await db.auditLog.count({ where: { action: "profile.view", actorId: ctx.userId } }),
    ).toBe(1);
    await addNote(db, ctx, applicationId, "Note interne.");
    const screening = await db.pipelineStage.findFirstOrThrow({
      where: { jobId, kind: "screening" },
    });
    const moved = await moveApplication(db, ctx, applicationId, screening.id);
    expect(moved?.to.kind).toBe("screening");
    await rejectApplication(db, ctx, applicationId, { reason: "skills", message: "Merci." });
    const [mine] = await listApplications(db, userId);
    expect(mine?.status).toBe("rejected");
    expect(mine?.events.map((event) => event.type)).toEqual([
      "submitted",
      "viewed",
      "stage_changed",
      "decision",
    ]);
  });

  it("une invitation acceptée donne le rôle prévu, dans la limite des sièges", async () => {
    const owner = await member((await org()).id);
    // RH Free: 1 seat, already taken by the owner.
    const email = `invite-${randomUUID()}@jumanly.test`;
    expect(await inviteMembers(db, owner, { emails: email, role: "recruiter" })).toMatchObject({
      ok: false,
      error: "seats",
    });
    await db.entitlementOverride.create({
      data: {
        subjectType: "organization",
        subjectId: owner.organizationId,
        key: "org.seats",
        value: "2",
        reason: "test",
      },
    });
    invalidate();
    const invited = await inviteMembers(db, owner, { emails: email, role: "recruiter" });
    if (!invited.ok) throw new Error(invited.error);
    const user = await db.user.create({
      data: { email, name: "Invité Fictif", emailVerified: true },
    });
    users.push(user.id);
    expect(await acceptInvitation(db, user, invited.invitations[0]!.token)).toMatchObject({
      ok: true,
    });
    const membership = await db.membership.findFirstOrThrow({ where: { userId: user.id } });
    expect(membership.role).toBe("recruiter");
    expect(await acceptInvitation(db, user, invited.invitations[0]!.token)).toMatchObject({
      ok: false,
      error: "expired",
    });
    await db.entitlementOverride.deleteMany({ where: { subjectId: owner.organizationId } });
  });
});

describe("modération et Connect", () => {
  it("une offre en ligne modifiée avec un contact hors plateforme repasse en vérification", async () => {
    const ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    const saved = await saveJob(
      db,
      ctx,
      { ...form(), description: "Écrivez-nous sur WhatsApp pour postuler." },
      jobId,
    );
    expect(saved.ok).toBe(true);
    const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.status).toBe("pending_review");
    expect(job.moderationFlags).toContain("contactOutside");
  });

  it("le premier message d'un talent prévient l'équipe de recrutement", async () => {
    const ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    const { userId, applicationId } = await applicant(jobId);
    const conversation = await ensureApplicationConversation(db, applicationId);
    const sent = await sendMessage(db, { userId }, conversation.id, { body: "Bonjour" });
    expect(sent.recipients).toEqual([ctx.userId]);
  });

  it("un talent signale un message de sa conversation, une seule fois ; masquer le retire", async () => {
    const ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    const { userId, applicationId } = await applicant(jobId);
    const conversation = await ensureApplicationConversation(db, applicationId);
    const sent = await sendMessage(db, { userId: ctx.userId, hire: ctx }, conversation.id, {
      body: "Payez 10 USD pour l'entretien.",
    });
    const report = { targetType: "message", targetId: sent.messageId, reason: "scam" };
    // Someone outside the conversation cannot report it.
    const stranger = await newUser();
    users.push(stranger.id);
    expect(await createReport(db, stranger.id, report)).toBe("notFound");
    expect(await createReport(db, userId, report)).toBe("created");
    expect(await createReport(db, userId, report)).toBe("already");
    const stored = await db.report.findFirstOrThrow({ where: { reporterId: userId } });
    const admin = await newUser();
    users.push(admin.id);
    const closed = await closeReport(db, admin.id, {
      report: stored.id,
      decision: "hide",
      reason: "Demande de paiement",
    });
    expect(closed?.reporterIds).toEqual([userId]);
    const message = await db.message.findUniqueOrThrow({ where: { id: sent.messageId } });
    expect(message.hiddenAt).not.toBeNull();
    await db.report.deleteMany({ where: { reporterId: userId } });
  });

  it("une correction demandée renvoie l'offre au recruteur, puis en vérification", async () => {
    const ctx = await member((await org()).id);
    const saved = await saveJob(db, ctx, {
      ...form(),
      description: "Frais de dossier de 20 USD à payer avant l'entretien.",
    });
    if (!saved.ok) throw new Error("save");
    expect((await publishJob(db, ctx, saved.jobId)).status).toBe("pending_review");
    expect((await moderationQueue(db)).some((job) => job.id === saved.jobId)).toBe(true);
    const admin = await newUser();
    users.push(admin.id);
    const job = await requestJobChanges(db, admin.id, {
      job: saved.jobId,
      reason: "Retirez les frais de dossier.",
      points: ["noPayment", "noPayment"],
    });
    expect(job).not.toBeNull();
    const sent = await db.job.findUniqueOrThrow({ where: { id: saved.jobId } });
    expect(sent.status).toBe("changes_requested");
    expect(sent.moderationChecks).toEqual(["noPayment"]);
    // Only a job in review can be sent back.
    expect(
      await requestJobChanges(db, admin.id, { job: saved.jobId, reason: "Encore", points: [] }),
    ).toBeNull();
    // Corrected and published again: back to a moderator, even without any flag left.
    await saveJob(db, ctx, form(), saved.jobId);
    expect((await publishJob(db, ctx, saved.jobId)).status).toBe("pending_review");
    const back = await db.job.findUniqueOrThrow({ where: { id: saved.jobId } });
    expect(back.moderationChecks).toEqual([]);
    const history = await db.auditLog.findMany({
      where: { targetType: "job", targetId: saved.jobId },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    });
    expect(history.map((row) => row.action)).toEqual(
      expect.arrayContaining(["job.changes", "job.resubmit"]),
    );
  });

  it("un signalement se clôt avec une décision et un motif, tous les doublons avec lui", async () => {
    const ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    const first = await applicant(jobId);
    const conversation = await ensureApplicationConversation(db, first.applicationId);
    for (const body of ["Un", "Deux", "Trois"])
      await sendMessage(db, { userId: first.userId }, conversation.id, { body });
    const sent = await sendMessage(db, { userId: ctx.userId, hire: ctx }, conversation.id, {
      body: "Message signalé",
    });
    for (const body of ["Quatre", "Cinq", "Six"])
      await sendMessage(db, { userId: first.userId }, conversation.id, { body });
    expect(
      await createReport(db, first.userId, {
        targetType: "message",
        targetId: sent.messageId,
        reason: "harassment",
      }),
    ).toBe("created");
    const report = await db.report.findFirstOrThrow({ where: { reporterId: first.userId } });
    const admin = await newUser();
    users.push(admin.id);

    // The context: two messages before, two after, and the read is logged.
    const thread = (await messageContext(db, admin.id, report.id))!;
    expect(thread.map((item) => item.body)).toEqual([
      "Deux",
      "Trois",
      "Message signalé",
      "Quatre",
      "Cinq",
    ]);
    expect(thread.find((item) => item.reported)?.side).toBe("org");
    expect(
      await db.auditLog.count({
        where: { actorId: admin.id, action: "report.context", targetId: sent.messageId },
      }),
    ).toBe(1);

    // A note moves it to « En cours ».
    expect(await addReportNote(db, admin.id, { report: report.id, note: "À vérifier." })).toBe(
      true,
    );
    expect((await db.report.findUniqueOrThrow({ where: { id: report.id } })).status).toBe(
      "in_progress",
    );
    expect((await reportNotes(db, report.id)).map((note) => note.note)).toEqual(["À vérifier."]);

    // « Avertir l'auteur »: closed with the reason, the author is returned to be warned.
    const closed = (await closeReport(db, admin.id, {
      report: report.id,
      decision: "warn",
      reason: "Propos déplacés.",
    }))!;
    expect(closed.author?.id).toBe(ctx.userId);
    expect(closed.reporterIds).toEqual([first.userId]);
    const stored = await db.report.findUniqueOrThrow({ where: { id: report.id } });
    expect(stored).toMatchObject({
      status: "closed",
      resolution: "warn",
      resolutionReason: "Propos déplacés.",
    });
    expect(stored.closedAt).not.toBeNull();
    const message = await db.message.findUniqueOrThrow({ where: { id: sent.messageId } });
    expect(message.hiddenAt).toBeNull();
    expect(
      await closeReport(db, admin.id, { report: report.id, decision: "hide", reason: "Encore" }),
    ).toBeNull();
    await db.report.deleteMany({ where: { reporterId: first.userId } });
  });
});
