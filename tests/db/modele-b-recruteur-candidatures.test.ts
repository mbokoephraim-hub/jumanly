/**
 * Modèle B recruteur, M5: the tab Candidatures of the phone reads and writes the applications
 * through services filtered by the organization (règle d'or 6). Opening a file is logged
 * (`profile.view`, règle d'or 5); a file is entrusted only to a member of the same company; a
 * proposal leaves in the conversation and the decision stays human.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import {
  HireError,
  publishJob,
  recordView,
  saveJob,
  type HireContext,
} from "@/server/services/hire";
import {
  assignApplication,
  phaseOf,
  PROPOSAL_EVENT,
  rhApplications,
  rhAssignees,
  rhInterviews,
  rhSearchApplications,
  sendProposal,
} from "@/server/services/hire-phone-candidatures";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function member(
  organizationId: string,
  role: "org_owner" | "recruiter" | "hiring_manager" = "org_owner",
): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

async function org() {
  const organization = await newOrganization("recruiter");
  orgs.push(organization.id);
  return db.organization.update({
    where: { id: organization.id },
    data: { verifiedAt: new Date() },
  });
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

async function applicant(jobId: string, name: string) {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({ where: { id: user.id }, data: { name } });
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const result = await applyToJob(db, { userId: user.id, jobSlug: job.slug });
  if (result.status !== "applied") throw new Error(result.status);
  return result.applicationId;
}

describe("Candidatures du recruteur au téléphone", () => {
  let a: HireContext;
  let colleague: HireContext;
  let b: HireContext;
  let jobA: string;
  let applicationA: string;

  beforeAll(async () => {
    invalidate();
    const orgA = await org();
    a = await member(orgA.id);
    colleague = await member(orgA.id, "recruiter");
    b = await member((await org()).id);
    jobA = await publishedJob(a);
    applicationA = await applicant(jobA, "Zénobie Testfictive");
  });

  it("ne montre que les candidatures de l'organisation", async () => {
    const own = await rhApplications(db, a, null);
    expect(own.rows.map((row) => row.id)).toEqual([applicationA]);
    expect(own.rows[0]!.phase).toBe("recue");
    expect(own.rows[0]!.unseen).toBe(true);
    const other = await rhApplications(db, b, null);
    expect(other.rows).toEqual([]);
    expect(other.offers).toEqual([]);
    await expect(rhApplications(db, b, jobA)).rejects.toThrow(HireError);
  });

  it("la recherche ne trouve pas les candidats d'une autre entreprise", async () => {
    const own = await rhSearchApplications(db, a, "Zénobie", "nom");
    expect(own.map((row) => row.id)).toEqual([applicationA]);
    expect(await rhSearchApplications(db, b, "Zénobie", "tout")).toEqual([]);
    expect(await rhSearchApplications(db, a, "Zénobie", "ville")).toEqual([]);
  });

  it("les entretiens sont ceux de l'organisation", async () => {
    await db.interview.create({
      data: {
        organizationId: a.organizationId,
        applicationId: applicationA,
        organizerId: a.userId,
        mode: "video",
        status: "pending",
        durationMinutes: 45,
        timezone: "Africa/Kinshasa",
        slots: [new Date(Date.now() + 2 * 86_400_000)],
      },
    });
    const own = await rhInterviews(db, a, null, "Africa/Kinshasa");
    expect(own.today.length + own.ahead.length).toBe(1);
    const other = await rhInterviews(db, b, null, "Africa/Kinshasa");
    expect(other.today.length + other.ahead.length + other.toDocument.length).toBe(0);
  });

  it("ouvrir la fiche est journalisé, jamais pour une autre entreprise", async () => {
    const before = await db.auditLog.count({
      where: { action: "profile.view", actorId: a.userId },
    });
    await recordView(db, a, applicationA);
    expect(await db.auditLog.count({ where: { action: "profile.view", actorId: a.userId } })).toBe(
      before + 1,
    );
    await expect(recordView(db, b, applicationA)).rejects.toThrow(HireError);
    expect(await db.auditLog.count({ where: { action: "profile.view", actorId: b.userId } })).toBe(
      0,
    );
  });

  it("confie un dossier à un collègue de l'entreprise seulement, et le prévient", async () => {
    const choices = await rhAssignees(db, a);
    expect(choices.map((item) => item.id).sort()).toEqual([a.userId, colleague.userId].sort());
    await expect(assignApplication(db, a, applicationA, b.userId)).rejects.toThrow(HireError);
    await expect(assignApplication(db, b, applicationA, b.userId)).rejects.toThrow(HireError);
    await assignApplication(db, a, applicationA, colleague.userId);
    const updated = await db.application.findUniqueOrThrow({ where: { id: applicationA } });
    expect(updated.assignedToId).toBe(colleague.userId);
    expect(
      await db.notification.count({
        where: { userId: colleague.userId, type: "candidateAssigned" },
      }),
    ).toBe(1);
    const followed = await rhAssignees(db, a);
    expect(followed.find((item) => item.id === colleague.userId)?.follows).toBe(1);
  });

  it("un responsable du recrutement ne peut ni confier ni proposer", async () => {
    const manager = await member(a.organizationId, "hiring_manager");
    await expect(assignApplication(db, manager, applicationA, a.userId)).rejects.toThrow(HireError);
    await expect(
      sendProposal(db, manager, applicationA, {
        body: "Bonjour, voici notre proposition fictive.",
        salary: 900,
        start: null,
      }),
    ).rejects.toThrow(HireError);
  });

  it("la proposition part dans la conversation sans décider à la place du recruteur", async () => {
    await expect(
      sendProposal(db, b, applicationA, {
        body: "Bonjour, voici notre proposition fictive.",
        salary: 900,
        start: null,
      }),
    ).rejects.toThrow(HireError);
    const { sent } = await sendProposal(db, a, applicationA, {
      body: "Bonjour, voici notre proposition fictive.",
      salary: 900,
      start: new Date("2026-12-01T00:00:00Z"),
    });
    expect(sent.messageId).toBeTruthy();
    const event = await db.applicationEvent.findFirstOrThrow({
      where: { applicationId: applicationA, type: PROPOSAL_EVENT },
    });
    expect((event.payload as { salary: number }).salary).toBe(90_000);
    const application = await db.application.findUniqueOrThrow({
      where: { id: applicationA },
      include: { stage: true },
    });
    expect(application.status).toBe("active");
    expect(["hired", "rejected"]).not.toContain(application.stage.kind);
    const rows = (await rhApplications(db, a, jobA)).rows;
    expect(rows[0]!.phase).toBe("proposition");
  });

  it("regroupe les étapes en six phases", () => {
    expect(phaseOf("new", false)).toBe("recue");
    expect(phaseOf("screening", false)).toBe("preselection");
    expect(phaseOf("test", false)).toBe("preselection");
    expect(phaseOf("interview", false)).toBe("entretien");
    expect(phaseOf("interview", true)).toBe("proposition");
    expect(phaseOf("offer", false)).toBe("proposition");
    expect(phaseOf("hired", true)).toBe("recrute");
    expect(phaseOf("rejected", false)).toBe("nonretenu");
  });
});
