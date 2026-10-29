import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import {
  activeJobCount,
  closeJob,
  getOrgJob,
  HireError,
  pauseJob,
  publishJob,
  resumeJob,
  type HireContext,
} from "@/server/services/hire";
import {
  attachJobSheet,
  listOffers,
  offerHistory,
  offerPerformance,
  offerStages,
  recordJobView,
  removeJobSheet,
  saveJobStep,
} from "@/server/services/hire-offers";
import { hireSearchPreview } from "@/server/services/hire-search";
import { applicationsThisWeek, hireToday } from "@/server/services/hire-today";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function recruiter({ verified = true } = {}): Promise<HireContext> {
  const organization = await newOrganization("recruiter");
  orgs.push(organization.id);
  if (verified)
    await db.organization.update({
      where: { id: organization.id },
      data: { verifiedAt: new Date() },
    });
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({
    data: { userId: user.id, organizationId: organization.id, role: "org_owner" },
  });
  return { userId: user.id, organizationId: organization.id, role: "org_owner" };
}

/** The four steps of the form, then publication. */
async function offer(
  ctx: HireContext,
  title = "Analyste fictif",
  candidature: Record<string, unknown> = {},
) {
  const first = await saveJobStep(db, ctx, "poste", {
    title,
    domain: "data",
    experienceMin: "0",
    city: "Kinshasa",
    country: "Congo-Kinshasa",
    remote: "hybrid",
    contractType: "cdi",
    openings: "2",
    salaryMin: "",
    salaryMax: "",
  });
  if (!first.ok) throw new Error(JSON.stringify(first));
  const second = await saveJobStep(
    db,
    ctx,
    "description",
    {
      description: "Suivre l'activité d'une structure fictive.",
      responsibilities: "Construire les tableaux de bord\nPréparer le rapport mensuel",
      requirements: "",
      benefits: "",
      requiredSkills: "Comptabilité",
      preferredSkills: "Excel",
    },
    first.jobId,
  );
  if (!second.ok) throw new Error(JSON.stringify(second));
  const third = await saveJobStep(
    db,
    ctx,
    "candidature",
    {
      closesAt: "",
      documents: ["cv"],
      questions: "[]",
      instructions: "",
      knockout: "",
      ...candidature,
    },
    first.jobId,
  );
  if (!third.ok) throw new Error(JSON.stringify(third));
  return first.jobId;
}

async function published(ctx: HireContext, title?: string) {
  const jobId = await offer(ctx, title);
  expect((await publishJob(db, ctx, jobId)).status).toBe("published");
  return jobId;
}

async function talent() {
  const user = await newUser();
  users.push(user.id);
  return user.id;
}

const slugOf = async (jobId: string) =>
  (await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { slug: true } })).slug;

describe("formulaire en 4 étapes", () => {
  it("crée un brouillon à l'étape 1 et garde chaque étape", async () => {
    const ctx = await recruiter();
    const jobId = await offer(ctx);
    const job = await getOrgJob(db, ctx, jobId);
    expect(job).toMatchObject({
      status: "draft",
      openings: 2,
      domain: "data",
      remote: "hybrid",
      requestedDocuments: ["cv"],
    });
    expect(job.skills.map((item) => [item.skill.name, item.importance]).sort()).toEqual([
      ["Comptabilité générale", "required"],
      ["Excel", "preferred"],
    ]);
  });

  it("refuse une compétence inconnue et une question sur une donnée protégée", async () => {
    const ctx = await recruiter();
    const jobId = await offer(ctx);
    expect(
      await saveJobStep(
        db,
        ctx,
        "description",
        { description: "x", requiredSkills: "Compétence inventée 123" },
        jobId,
      ),
    ).toMatchObject({ ok: false, error: "unknownSkills" });
    expect(
      await saveJobStep(
        db,
        ctx,
        "candidature",
        { questions: JSON.stringify([{ id: "q1", text: "Quel est votre âge ?", kind: "text" }]) },
        jobId,
      ),
    ).toMatchObject({ ok: false, error: "forbidden", field: "questions" });
  });

  it("une organisation non vérifiée publie aussitôt (décision du 29/10/2026)", async () => {
    const ctx = await recruiter({ verified: false });
    const jobId = await offer(ctx);
    expect(await publishJob(db, ctx, jobId)).toMatchObject({ status: "published" });
    const rows = await listOffers(db, ctx);
    expect(rows.find((row) => row.id === jobId)).toMatchObject({ tab: "actives" });
  });

  it("une offre sans description ni compétence indispensable n'est pas publiée", async () => {
    const ctx = await recruiter();
    const first = await saveJobStep(db, ctx, "poste", {
      title: "Incomplète fictive",
      city: "Goma",
      country: "Congo-Kinshasa",
      remote: "onsite",
      contractType: "cdd",
    });
    if (!first.ok) throw new Error();
    expect(await publishJob(db, ctx, first.jobId)).toMatchObject({
      status: "incomplete",
      missing: "description",
    });
  });
});

describe("pause et limite d'offres actives (jobs.active.max)", () => {
  it("une offre en pause ne compte pas dans la limite", async () => {
    // Sans abonnement, l'organisation a la formule gratuite : 1 offre active.
    const ctx = await recruiter();
    const first = await published(ctx, "Première fictive");
    const second = await offer(ctx, "Deuxième fictive");
    expect(await publishJob(db, ctx, second)).toMatchObject({ status: "limit", max: 1 });

    await pauseJob(db, ctx, first);
    expect(await activeJobCount(db, ctx.organizationId)).toBe(0);
    expect((await publishJob(db, ctx, second)).status).toBe("published");

    // Reprendre la première dépasserait la limite : elle reste en pause.
    expect(await resumeJob(db, ctx, first)).toMatchObject({ status: "limit", max: 1 });
    expect((await db.job.findUniqueOrThrow({ where: { id: first } })).status).toBe("paused");

    await closeJob(db, ctx, second);
    expect(await resumeJob(db, ctx, first)).toMatchObject({ status: "published" });
    const job = await db.job.findUniqueOrThrow({ where: { id: first } });
    expect(job).toMatchObject({ status: "published", pausedAt: null });
  });

  it("une offre en pause garde sa page mais ne reçoit plus de candidature", async () => {
    const ctx = await recruiter();
    const jobId = await published(ctx, "En pause fictive");
    await pauseJob(db, ctx, jobId);
    const rows = await listOffers(db, ctx);
    expect(rows.find((row) => row.id === jobId)?.tab).toBe("pause");
    expect(await applyToJob(db, { userId: await talent(), jobSlug: await slugOf(jobId) })).toEqual({
      status: "closed",
    });
  });

  it("seule une offre publiée se met en pause", async () => {
    const ctx = await recruiter();
    const jobId = await offer(ctx);
    await expect(pauseJob(db, ctx, jobId)).rejects.toBeInstanceOf(HireError);
  });
});

describe("questions de présélection (règle d'or n° 1)", () => {
  const questions = JSON.stringify([
    { id: "q1", text: "Êtes-vous disponible avant le 1er décembre ?", kind: "yesno" },
    { id: "q2", text: "Quel outil de tableau de bord utilisez-vous ?", kind: "text" },
  ]);

  it("ne bloquent jamais une candidature, même sans aucune réponse", async () => {
    const ctx = await recruiter();
    const jobId = await offer(ctx, "Avec questions fictive", { questions });
    await publishJob(db, ctx, jobId);
    const result = await applyToJob(db, { userId: await talent(), jobSlug: await slugOf(jobId) });
    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const application = await db.application.findUniqueOrThrow({
      where: { id: result.applicationId },
    });
    expect(application.screeningAnswers).toEqual([]);
  });

  it("gardent les réponses données, avec la question, et ignorent le reste", async () => {
    const ctx = await recruiter();
    const jobId = await offer(ctx, "Réponses fictive", { questions });
    await publishJob(db, ctx, jobId);
    const result = await applyToJob(db, {
      userId: await talent(),
      jobSlug: await slugOf(jobId),
      answers: { q1: "peut-être", q2: "  Power BI  ", inventee: "oui" },
    });
    if (result.status !== "applied") throw new Error(result.status);
    const application = await db.application.findUniqueOrThrow({
      where: { id: result.applicationId },
    });
    expect(application.screeningAnswers).toEqual([
      {
        id: "q2",
        question: "Quel outil de tableau de bord utilisez-vous ?",
        kind: "text",
        answer: "Power BI",
      },
    ]);
  });
});

describe("isolation des organisations (règle d'or n° 6)", () => {
  it("une autre organisation ne touche ni la pause, ni l'historique, ni la fiche, ni les chiffres", async () => {
    const a = await recruiter();
    const b = await recruiter();
    const jobB = await published(b, "Offre de B fictive");
    const notFound = (promise: Promise<unknown>) =>
      expect(promise).rejects.toMatchObject({ code: "notFound" });
    await notFound(pauseJob(db, a, jobB));
    await notFound(resumeJob(db, a, jobB));
    await notFound(offerHistory(db, a, jobB));
    await notFound(offerPerformance(db, a, jobB));
    await notFound(offerStages(db, a, jobB));
    await notFound(removeJobSheet(db, a, jobB));
    await notFound(
      attachJobSheet(db, a, jobB, { name: "fiche.pdf", bytes: new Uint8Array([1, 2, 3]) }),
    );
    await notFound(saveJobStep(db, a, "description", { description: "Détournée" }, jobB));
    expect((await listOffers(db, a)).some((row) => row.id === jobB)).toBe(false);
    expect((await db.job.findUniqueOrThrow({ where: { id: jobB } })).status).toBe("published");
  });

  it("À traiter ne compte que les candidatures de l'organisation", async () => {
    const a = await recruiter();
    const b = await recruiter();
    const jobB = await published(b, "Offre B à traiter");
    await applyToJob(db, { userId: await talent(), jobSlug: await slugOf(jobB) });
    expect((await hireToday(db, a)).counts.unseen).toBe(0);
    expect((await hireToday(db, b)).counts.unseen).toBe(1);
  });

  it("Ctrl K et la semaine ne montrent que les offres et candidats de l'organisation", async () => {
    const a = await recruiter();
    const b = await recruiter();
    const jobB = await published(b, "Offre cherchée Zéphyr");
    await applyToJob(db, { userId: await talent(), jobSlug: await slugOf(jobB) });
    expect(await hireSearchPreview(db, a, "Zéphyr")).toEqual([]);
    expect(await hireSearchPreview(db, a, "Test Fictif")).toEqual([]);
    expect((await applicationsThisWeek(db, a)).total).toBe(0);
    const found = await hireSearchPreview(db, b, "zéphyr");
    expect(found).toEqual([
      { kind: "offer", title: "Offre cherchée Zéphyr", href: `/app/hire/offres/${jobB}` },
    ]);
    const people = await hireSearchPreview(db, b, "Test Fictif");
    expect(people.map((item) => item.kind)).toEqual(["candidate"]);
    const week = await applicationsThisWeek(db, b);
    expect(week.total).toBe(1);
    expect(week.days).toHaveLength(7);
    expect(week.days.reduce((sum, day) => sum + day.count, 0)).toBe(1);
  });
});

describe("fiche, vues, historique et étapes", () => {
  it("garde une fiche PDF vérifiée, la retire, refuse un fichier qui n'est pas un PDF", async () => {
    const ctx = await recruiter();
    const jobId = await offer(ctx);
    const pdf = await PDFDocument.create();
    pdf.addPage().drawText("Responsabilites fictives");
    const bytes = await pdf.save();
    await attachJobSheet(db, ctx, jobId, { name: "Fiche fictive.pdf", bytes });
    let job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job).toMatchObject({ jobSheetName: "Fiche fictive.pdf", jobSheetPages: 1 });
    expect(job.jobSheetKey).toMatch(new RegExp(`^jobs/${jobId}/`));
    await removeJobSheet(db, ctx, jobId);
    job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.jobSheetKey).toBeNull();
    await expect(
      attachJobSheet(db, ctx, jobId, { name: "x.pdf", bytes: new TextEncoder().encode("bonjour") }),
    ).rejects.toMatchObject({ code: "type" });
  });

  it("compte les vues par jour, sans personne, et les montre dans la performance", async () => {
    const ctx = await recruiter();
    const jobId = await published(ctx, "Vues fictive");
    const slug = await slugOf(jobId);
    await recordJobView(db, slug);
    await recordJobView(db, slug);
    expect((await listOffers(db, ctx)).find((row) => row.id === jobId)?.figures.views).toBe(2);
    const performance = await offerPerformance(db, ctx, jobId);
    expect(performance.views).toBe(2);
    expect(performance.week).toHaveLength(7);
    expect(performance.week[6]?.count).toBe(2);
    // Un brouillon n'est pas vu.
    expect(await recordJobView(db, await slugOf(await offer(ctx, "Brouillon fictif")))).toBe(false);
  });

  it("l'historique donne un type à chaque événement", async () => {
    const ctx = await recruiter();
    const jobId = await published(ctx, "Historique fictive");
    await applyToJob(db, { userId: await talent(), jobSlug: await slugOf(jobId) });
    await saveJobStep(
      db,
      ctx,
      "candidature",
      { closesAt: "2030-01-31", documents: [], questions: "[]" },
      jobId,
    );
    await pauseJob(db, ctx, jobId);
    const history = await offerHistory(db, ctx, jobId);
    const keys = history.map((event) => `${event.type}:${event.key}`);
    expect(keys).toEqual(
      expect.arrayContaining([
        "publication:published",
        "candidature:applied",
        "modification:deadline",
        "modification:paused",
      ]),
    );
  });

  it("les nouvelles offres suivent les étapes Reçue → Décision finale", async () => {
    const ctx = await recruiter();
    const jobId = await published(ctx, "Étapes fictive");
    expect((await offerStages(db, ctx, jobId)).map((stage) => stage.name)).toEqual([
      "Reçue",
      "En examen",
      "Présélectionnée",
      "Entretien",
      "Décision finale",
    ]);
  });
});
