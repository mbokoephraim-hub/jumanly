import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { ConnectError, ensureApplicationConversation } from "@/server/services/connect";
import { sendDocument, sendLink, sendSlot } from "@/server/services/conversation-attachments";
import {
  hireApplication,
  HireError,
  publishJob,
  saveJob,
  type HireContext,
} from "@/server/services/hire";
import {
  deleteTemplate,
  getTemplate,
  listTemplates,
  organizationTemplate,
  saveTemplate,
} from "@/server/services/message-templates";
import { pendingDocumentRequests, talentInterviews } from "@/server/services/suivi";
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

async function org() {
  const organization = await newOrganization("recruiter");
  orgs.push(organization.id);
  return organization;
}

async function publishedJob(ctx: HireContext) {
  const saved = await saveJob(db, ctx, {
    title: "Assistant fictif",
    contractType: "cdi",
    remote: "onsite",
    city: "Kinshasa",
    country: "Congo-Kinshasa",
    salaryMin: "",
    salaryMax: "",
    closesAt: "",
    description: "Accueil et suivi administratif d'une structure fictive.",
    responsibilities: "Accueillir\nClasser",
    requirements: "",
    benefits: "",
    experienceMin: "0",
    requiredSkills: "Administration",
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
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
  if (result.status !== "applied") throw new Error(result.status);
  return { userId: user.id, applicationId: result.applicationId };
}

// Prompt 5: the templates of an organization are never reachable from another one (golden rule 6).
describe("modèles de message : isolation des organisations", () => {
  let a: HireContext;
  let b: HireContext;
  let templateA: string;

  beforeAll(async () => {
    a = await member((await org()).id);
    b = await member((await org()).id);
    const saved = await saveTemplate(db, a, {
      kind: "refus",
      title: "Refus poli",
      body: "Bonjour {prenom}, merci pour votre candidature au poste de {poste}.",
    });
    templateA = saved.id;
  });

  it("liste, lit et utilise seulement les modèles de sa propre organisation", async () => {
    expect((await listTemplates(db, a)).map((template) => template.id)).toContain(templateA);
    expect(await listTemplates(db, b)).toEqual([]);
    expect((await organizationTemplate(db, a, "refus"))?.id).toBe(templateA);
    expect(await organizationTemplate(db, b, "refus")).toBeNull();
  });

  it("refuse de lire, modifier ou supprimer le modèle d'une autre organisation", async () => {
    await expect(getTemplate(db, b, templateA)).rejects.toThrow(HireError);
    await expect(
      saveTemplate(db, b, { id: templateA, kind: "refus", title: "Pris", body: "Texte modifié" }),
    ).rejects.toThrow(HireError);
    await expect(deleteTemplate(db, b, templateA)).rejects.toThrow(HireError);
    const untouched = await db.messageTemplate.findUniqueOrThrow({ where: { id: templateA } });
    expect(untouched.title).toBe("Refus poli");
    expect(untouched.organizationId).toBe(a.organizationId);
  });

  it("un membre qui ne gère pas les candidatures ne peut pas écrire de modèle", async () => {
    const viewer = await member(a.organizationId, "viewer");
    await expect(
      saveTemplate(db, viewer, { kind: "relance", title: "Relance", body: "Bonjour {prenom}" }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("décisions, pièces jointes et suivi des entretiens", () => {
  let ctx: HireContext;
  let talent: { userId: string; applicationId: string };
  let conversationId: string;

  beforeAll(async () => {
    ctx = await member((await org()).id);
    const jobId = await publishedJob(ctx);
    talent = await applicant(jobId);
    conversationId = (await ensureApplicationConversation(db, talent.applicationId)).id;
  });

  it("le talent envoie une copie de son propre CV, jamais celui d'un autre", async () => {
    const profile = await db.talentProfile.findUniqueOrThrow({ where: { userId: talent.userId } });
    const cv = await db.document.create({
      data: { profileId: profile.id, kind: "cv", title: "CV fictif", content: { info: {} } },
    });
    const sent = await sendDocument(db, { userId: talent.userId }, conversationId, cv.id);
    const message = await db.message.findUniqueOrThrow({ where: { id: sent.messageId } });
    expect(message.kind).toBe("file");
    expect(message.payload).toMatchObject({ document: { type: "cv", title: "CV fictif" } });

    const other = await newUser();
    users.push(other.id);
    await expect(sendDocument(db, { userId: other.id }, conversationId, cv.id)).rejects.toThrow(
      ConnectError,
    );
    // The recruiting side never sends the talent's files.
    await expect(
      sendDocument(db, { userId: ctx.userId, hire: ctx }, conversationId, cv.id),
    ).rejects.toThrow(ConnectError);
  });

  it("un créneau doit être à venir ; un lien doit être une adresse http(s)", async () => {
    const now = new Date("2030-03-02T08:00:00Z");
    await expect(
      sendSlot(
        db,
        { userId: talent.userId },
        conversationId,
        {
          date: "2030-03-01",
          time: "10:00",
          note: "",
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    const slot = await sendSlot(
      db,
      { userId: talent.userId },
      conversationId,
      { date: "2030-03-04", time: "10:00", note: "Disponible ce matin-là" },
      now,
    );
    const slotMessage = await db.message.findUniqueOrThrow({ where: { id: slot.messageId } });
    expect(slotMessage.kind).toBe("slot");
    expect(slotMessage.payload).toMatchObject({ note: "Disponible ce matin-là" });

    const link = await sendLink(db, { userId: talent.userId }, conversationId, {
      url: "https://exemple.test/portfolio",
      label: "",
    });
    const linkMessage = await db.message.findUniqueOrThrow({ where: { id: link.messageId } });
    expect(linkMessage.payload).toMatchObject({ link: "https://exemple.test/portfolio" });
  });

  it("le suivi met l'entretien à confirmer en premier et liste les documents demandés", async () => {
    const now = new Date();
    const inDays = (days: number) => new Date(now.getTime() + days * 86_400_000);
    const base = {
      organizationId: ctx.organizationId,
      applicationId: talent.applicationId,
      organizerId: ctx.userId,
      mode: "video" as const,
      durationMinutes: 45,
      timezone: "Africa/Kinshasa",
    };
    const confirmed = await db.interview.create({
      data: { ...base, status: "confirmed", slots: [inDays(1)], startsAt: inDays(1) },
    });
    const pending = await db.interview.create({
      data: { ...base, status: "pending", slots: [inDays(5), inDays(6)] },
    });
    await db.interview.create({
      data: { ...base, status: "pending", slots: [inDays(-2)] },
    });
    const list = await talentInterviews(db, talent.userId, now);
    expect(list.map((interview) => interview.id)).toEqual([pending.id, confirmed.id]);

    await db.message.create({
      data: {
        conversationId,
        senderId: ctx.userId,
        body: "Merci de l'envoyer",
        kind: "document_request",
        payload: { name: "Attestation de stage", due: inDays(3).toISOString() },
      },
    });
    const requests = await pendingDocumentRequests(db, talent.userId);
    expect(requests.map((request) => request.name)).toContain("Attestation de stage");
  });

  it("retenir un candidat le passe à l'étape « Embauché »", async () => {
    const moved = await hireApplication(db, ctx, talent.applicationId, { messageSent: true });
    expect(moved?.to.kind).toBe("hired");
    const application = await db.application.findUniqueOrThrow({
      where: { id: talent.applicationId },
    });
    expect(application.status).toBe("hired");
  });
});
