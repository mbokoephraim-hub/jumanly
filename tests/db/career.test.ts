import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate, usage } from "@/server/entitlements";
import {
  decideCorrections,
  generateDocument,
  generateLinkedin,
  getDocument,
  latestLinkedin,
  proofread,
  tailorCv,
} from "@/server/services/career-documents";
import { emptyCv, parseCv } from "@/server/services/cv";
import {
  answerQuestion,
  finishInterview,
  discardInterview,
  getInterview,
  InterviewError,
  questionCount,
  startInterview,
  type InterviewSetup,
} from "@/server/services/interview-sim";
import { projectCover, rewriteTemplate } from "@/server/services/career-phone";
import {
  parseProject,
  PortfolioError,
  projectFileFor,
  projectSchema,
  publicPortfolio,
  savePortfolioSettings,
  saveProject,
} from "@/server/services/portfolio";
import { completeLesson, LearnError } from "@/server/services/learn";
import { fakeStorage } from "@/server/storage";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
const courses: string[] = [];

afterAll(async () => {
  await db.aiUsage.deleteMany({ where: { userId: { in: users } } });
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await cleanup(users);
  await db.$disconnect();
});
beforeEach(() => invalidate());

/** A talent on the cheapest talent plan whose entitlement `key` has `value` (never a plan name). */
async function talent(entitlement?: { key: string; value: string }, consent = true) {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({
    where: { id: user.id },
    data: { firstName: "Test", lastName: "Fictif", aiConsentAt: consent ? new Date() : null },
  });
  if (entitlement) {
    const plan = await db.plan.findFirstOrThrow({
      where: {
        family: "talent",
        entitlements: { some: { key: entitlement.key, value: entitlement.value } },
      },
      orderBy: { priceCents: "asc" },
    });
    const now = new Date();
    await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        status: "active",
        source: "self",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      },
    });
  }
  return user;
}

async function profileWithSkills(userId: string, names: string[]) {
  const profile = await db.talentProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, headline: "Chargé de clientèle", targetJob: "Chargé de clientèle" },
  });
  for (const name of names) {
    const skill = await db.skill.findFirstOrThrow({ where: { name } });
    await db.profileSkill.create({
      data: { profileId: profile.id, skillId: skill.id, level: 2, source: "declared" },
    });
  }
  return profile;
}

const bank = Array.from({ length: 8 }, (_, index) => `Question de test numéro ${index + 1} ?`);
const setup = (mode: "text" | "voice" = "text"): InterviewSetup => ({
  mode,
  type: "hr",
  level: "standard",
  durationMinutes: 10,
  jobTitle: "Chargé de clientèle",
  jobId: undefined,
});
const textQuota = (userId: string) =>
  usage(db, { type: "user", id: userId }, "career.interview.text.monthly");

describe("simulations d'entretien (E10, partie 08 § 8.9)", () => {
  it("sans simulation dans le forfait : verrou, rien n'est consommé", async () => {
    const user = await talent({ key: "career.interview.text.monthly", value: "0" });
    await expect(startInterview(db, user.id, setup(), bank)).rejects.toMatchObject({
      code: "entitlement",
    });
  });

  it("sans consentement à l'IA : aucune séance, aucun quota utilisé", async () => {
    const user = await talent({ key: "career.interview.text.monthly", value: "3" }, false);
    await expect(startInterview(db, user.id, setup(), bank)).rejects.toMatchObject({
      code: "consent",
    });
    expect((await textQuota(user.id)).used).toBe(0);
  });

  it("une séance utilise une simulation du mois, jamais de crédit IA ; le quota bloque ensuite", async () => {
    const user = await talent({ key: "career.interview.text.monthly", value: "3" });
    const first = await startInterview(db, user.id, setup(), bank);
    const session = await getInterview(db, user.id, first.id);
    expect(session?.turns).toHaveLength(questionCount(10));
    expect(session?.turns[0].question).toBe(bank[0]);
    expect((await textQuota(user.id)).used).toBe(1);
    const credits = await usage(db, { type: "user", id: user.id }, "ai.credits.monthly");
    expect(credits.used).toBe(0);
    await startInterview(db, user.id, setup(), bank);
    await startInterview(db, user.id, setup(), bank);
    const error = await startInterview(db, user.id, setup(), bank).catch((value) => value);
    expect(error).toBeInstanceOf(InterviewError);
    expect(error.code).toBe("quota");
  });

  it("le mode oral suit son propre quota", async () => {
    const user = await talent({ key: "career.interview.text.monthly", value: "3" });
    const textLimit = (await textQuota(user.id)).limit;
    expect(textLimit).not.toBe(0);
    await expect(startInterview(db, user.id, setup("voice"), bank)).rejects.toMatchObject({
      code: "entitlement",
    });
  });

  it("retour structuré par critère, sans note, et réservé à son auteur", async () => {
    const user = await talent({ key: "career.interview.text.monthly", value: "3" });
    const other = await talent({ key: "career.interview.text.monthly", value: "3" });
    const { id } = await startInterview(db, user.id, setup(), bank);
    await answerQuestion(db, user.id, id, {
      answer:
        "Lors de mon stage chez un opérateur, j'ai repris le suivi des réclamations clients. J'ai mis en place un tableau partagé, ce qui a permis de réduire les délais de réponse de 5 jours à 2 jours.",
    });
    await answerQuestion(db, user.id, id, { answer: "Je suis motivé." });
    expect(await getInterview(db, other.id, id)).toBeNull();
    await expect(finishInterview(db, other.id, id)).rejects.toMatchObject({ code: "notFound" });
    const done = await finishInterview(db, user.id, id);
    expect(done?.status).toBe("completed");
    const feedback = done?.feedbackData;
    expect(feedback?.criteria.map((item) => item.key)).toEqual([
      "structure",
      "relevance",
      "examples",
      "clarity",
    ]);
    expect(feedback?.perQuestion.map((item) => item.index)).toEqual([0, 1]);
    expect(JSON.stringify(feedback)).not.toMatch(/score|\/100|%/);
    const log = await db.aiUsage.findMany({ where: { userId: user.id } });
    expect(log.map((row) => row.feature).sort()).toEqual([
      "interview_feedback",
      "interview_questions",
    ]);
  });
});

describe("simulations au téléphone : essai, annulation, reprise (Modèle B, lot B6)", () => {
  const trialUsage = (userId: string) =>
    usage(db, { type: "user", id: userId }, "career.interview.trial.monthly");
  const phone = (focus: InterviewSetup["type"], minutes: number): InterviewSetup => ({
    ...setup("voice"),
    type: focus,
    level: "easy",
    durationMinutes: minutes,
  });
  /** A talent whose plan has no voice session but one trial (read from the plans, never named). */
  async function trialTalent() {
    const user = await talent({ key: "career.interview.voice.monthly", value: "0" });
    const trial = await trialUsage(user.id);
    return { user, trial };
  }

  it("sans l'oral dans le forfait : un essai de 5 minutes, sujets avancés et longues durées exclus", async () => {
    const { user, trial } = await trialTalent();
    if (trial.limit === 0) return; // the plan has no trial: nothing to try
    await expect(startInterview(db, user.id, phone("traps", 5), bank)).rejects.toMatchObject({
      code: "entitlement",
    });
    await expect(startInterview(db, user.id, phone("motivation", 10), bank)).rejects.toMatchObject({
      code: "entitlement",
    });
    const session = await startInterview(db, user.id, phone("motivation", 5), bank, new Date(), {
      phone: true,
    });
    expect((await getInterview(db, user.id, session.id))?.turns).toHaveLength(3);
    expect((await trialUsage(user.id)).used).toBe(1);
    if (trial.limit === 1) {
      await expect(startInterview(db, user.id, phone("motivation", 5), bank)).rejects.toMatchObject(
        { code: "quota" },
      );
    }
  });

  it("annuler avant la première réponse rend l'unité ; une réponse donnée n'est jamais effacée", async () => {
    const { user, trial } = await trialTalent();
    if (trial.limit === 0) return;
    const first = await startInterview(db, user.id, phone("motivation", 5), bank);
    expect(await discardInterview(db, user.id, first.id)).toBe(true);
    expect(await getInterview(db, user.id, first.id)).toBeNull();
    expect((await trialUsage(user.id)).used).toBe(0);

    const second = await startInterview(db, user.id, phone("motivation", 5), bank);
    await answerQuestion(db, user.id, second.id, {
      answer: "J'ai réduit les délais de traitement de 5 à 2 jours.",
      durationSec: 20,
    });
    expect(await discardInterview(db, user.id, second.id)).toBe(false);
    expect(await getInterview(db, user.id, second.id)).not.toBeNull();
    expect((await trialUsage(user.id)).used).toBe(1);
  });

  it("refaire des questions reprend exactement les mêmes, avec leurs indices", async () => {
    const user = await talent({ key: "career.interview.text.monthly", value: "3" });
    const replay = [
      { question: "Question rejouée A ?", hint: "Indice A" },
      { question: "Question rejouée B ?", hint: null },
    ];
    const session = await startInterview(
      db,
      user.id,
      { ...setup("text"), durationMinutes: 5 },
      replay.map((item) => item.question),
      new Date(),
      { replay },
    );
    const turns = (await getInterview(db, user.id, session.id))?.turns ?? [];
    expect(turns.map((item) => item.question)).toEqual([
      "Question rejouée A ?",
      "Question rejouée B ?",
    ]);
    expect(turns[0].hint).toBe("Indice A");
    expect((await textQuota(user.id)).used).toBe(1);
  });
});

describe("documents, correction, LinkedIn et adaptation du CV (E10)", () => {
  it("lettres et correction : verrou sans `career.documents`", async () => {
    const user = await talent({ key: "career.documents", value: "false" });
    const result = await generateDocument(
      db,
      user.id,
      { type: "letter", jobId: undefined, tone: "formal", length: "standard", points: "" },
      () => ({ title: "Lettre", text: "Texte" }),
    );
    expect(result).toEqual({ ok: false, code: "entitlement" });
  });

  it("une lettre est rédigée à partir du profil et utilise des crédits", async () => {
    const user = await talent({ key: "career.documents", value: "true" });
    await profileWithSkills(user.id, []);
    const result = await generateDocument(
      db,
      user.id,
      { type: "letter", jobId: undefined, tone: "formal", length: "standard", points: "mon stage" },
      (type, values) => ({ title: `${type} ${values.jobTitle}`, text: values.points }),
    );
    expect(result.ok).toBe(true);
    const document = await getDocument(db, user.id, result.ok ? result.id : "");
    expect(document?.kind).toBe("cover_letter");
    expect(document?.data.text).toBe("mon stage");
    const credits = await usage(db, { type: "user", id: user.id }, "ai.credits.monthly");
    expect(credits.used).toBe(2);
  });

  it("la correction propose des changements que le talent applique", async () => {
    const user = await talent({ key: "career.documents", value: "true" });
    await profileWithSkills(user.id, []);
    const result = await proofread(db, user.id, {
      title: "Correction",
      text: "bonjour,  je vous écris . merci",
    });
    if (!result.ok) throw new Error(result.code);
    const document = await getDocument(db, user.id, result.id);
    expect(document?.data.corrections.length).toBeGreaterThan(0);
    await decideCorrections(
      db,
      user.id,
      result.id,
      document!.data.corrections.map((item) => item.id),
    );
    const after = await getDocument(db, user.id, result.id);
    expect(after?.data.text).toBe("Bonjour, je vous écris. Merci");
    expect(after?.data.corrections).toHaveLength(0);
  });

  it("LinkedIn ne propose que les compétences du profil", async () => {
    const user = await talent({ key: "career.linkedin", value: "true" });
    const skills = await db.skill.findMany({ take: 2, orderBy: { name: "asc" } });
    await profileWithSkills(
      user.id,
      skills.map((skill) => skill.name),
    );
    expect(await generateLinkedin(db, user.id, () => "À propos")).toEqual({ ok: true });
    const proposal = await latestLinkedin(db, user.id);
    expect(proposal?.skills.sort()).toEqual(skills.map((skill) => skill.name).sort());
    expect(proposal?.headline.length).toBeLessThanOrEqual(220);
  });

  it("le CV adapté met en avant l'offre sans ajouter de compétence", async () => {
    const user = await talent({ key: "career.cv.tailor", value: "true" });
    const job = await db.job.findFirstOrThrow({
      where: { status: "published", skills: { some: {} } },
      include: { skills: { include: { skill: true } } },
    });
    const jobSkill = job.skills[0].skill;
    const own = await db.skill.findFirstOrThrow({
      where: { id: { notIn: job.skills.map((item) => item.skillId) } },
    });
    const profile = await profileWithSkills(user.id, [own.name, jobSkill.name]);
    const cv = await db.document.create({
      data: {
        profileId: profile.id,
        kind: "cv",
        title: "CV",
        content: {
          ...emptyCv,
          info: { ...emptyCv.info, headline: "Chargé de clientèle" },
          skills: [
            { name: own.name, level: 2 },
            { name: jobSkill.name, level: 2 },
          ],
        },
      },
    });
    const result = await tailorCv(db, user.id, {
      cvId: cv.id,
      jobId: job.id,
      title: (jobTitle) => `CV · ${jobTitle}`,
    });
    if (!result.ok) throw new Error(result.code);
    const tailored = await db.document.findUniqueOrThrow({ where: { id: result.id } });
    const content = parseCv(tailored.content);
    expect(content.skills.map((skill) => skill.name)).toEqual([jobSkill.name, own.name]);
    expect(tailored.title).toBe(`CV · ${job.title}`);
  });
});

describe("portfolio (E10, `career.portfolio.level`)", () => {
  const project = projectSchema.parse({
    title: "Projet fictif",
    context: "Un résultat imaginaire",
    skills: ["Excel", "Communication"],
    visible: true,
  });
  const storage = fakeStorage();
  // The first bytes of a PNG: enough for the type check.
  const png = { name: "capture.png", bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]) };

  it("sans portfolio dans le forfait : verrou", async () => {
    const user = await talent({ key: "career.portfolio.level", value: "none" });
    await expect(saveProject(db, storage, user.id, project, [])).rejects.toBeInstanceOf(
      PortfolioError,
    );
  });

  it("la page publique n'existe que publiée, et le niveau standard garde la mise en page classique", async () => {
    const user = await talent({ key: "career.portfolio.level", value: "standard" });
    const id = await saveProject(db, storage, user.id, project, [png]);
    // A hidden project stays out of the public page.
    await saveProject(db, storage, user.id, { ...project, title: "Caché", visible: false }, []);
    const profile = await savePortfolioSettings(db, user.id, {
      intro: "Présentation",
      layout: "grid",
      accent: "feuille",
      public: true,
    });
    expect(profile.portfolioLayout).toBe("classic");
    const page = await publicPortfolio(db, profile.portfolioSlug!);
    expect(page?.projects.map((item) => item.title)).toEqual(["Projet fictif"]);
    // Its file: for anyone while published, for its owner only once withdrawn.
    expect(await projectFileFor(db, storage, null, id, 0)).toMatchObject({ name: "capture.png" });
    expect(page?.name).toBe("Test Fictif");
    expect(Object.keys(page ?? {}).sort()).toEqual(
      ["accent", "headline", "intro", "layout", "name", "projects"].sort(),
    );
    await savePortfolioSettings(db, user.id, { intro: "", layout: "classic", public: false });
    expect(await publicPortfolio(db, profile.portfolioSlug!)).toBeNull();
    expect(await projectFileFor(db, storage, null, id, 0)).toBeNull();
    expect(await projectFileFor(db, storage, user.id, id, 0)).not.toBeNull();
    // A file that is not a photo or a PDF is refused.
    await expect(
      saveProject(db, storage, user.id, project, [
        { name: "x.exe", bytes: new Uint8Array([1, 2]) },
      ]),
    ).rejects.toBeInstanceOf(PortfolioError);
  });
});

describe("exercices métier (`learn.exercises.job_specific`)", () => {
  it("verrouillés sans le droit et hors de la progression", async () => {
    const course = await db.course.create({
      data: {
        slug: `test-exercices-${Date.now()}`,
        title: "Formation test",
        summary: "Test",
        description: "Test",
        audience: "Test",
        category: "Test",
        level: "beginner",
        durationMinutes: 30,
        requiredLevel: "free",
        status: "published",
        jobFamilies: ["Relation client"],
        modules: {
          create: {
            order: 1,
            title: "Module",
            lessons: {
              create: [
                { order: 1, title: "Leçon", kind: "text" },
                { order: 2, title: "Exercice métier", kind: "exercise", jobSpecific: true },
              ],
            },
          },
        },
      },
      include: { modules: { include: { lessons: { orderBy: { order: "asc" } } } } },
    });
    courses.push(course.id);
    const [lesson, exercise] = course.modules[0].lessons;
    const user = await talent({ key: "learn.exercises.job_specific", value: "false" });
    await db.enrollment.create({ data: { userId: user.id, courseId: course.id } });
    await expect(completeLesson(db, user.id, exercise.id)).rejects.toBeInstanceOf(LearnError);
    await completeLesson(db, user.id, lesson.id);
    const enrollment = await db.enrollment.findFirstOrThrow({
      where: { userId: user.id, courseId: course.id },
    });
    expect(enrollment.progress).toBe(100);
    expect(enrollment.completedAt).not.toBeNull();

    const pro = await talent({ key: "learn.exercises.job_specific", value: "true" });
    await db.enrollment.create({ data: { userId: pro.id, courseId: course.id } });
    await completeLesson(db, pro.id, exercise.id);
    const proEnrollment = await db.enrollment.findFirstOrThrow({
      where: { userId: pro.id, courseId: course.id },
    });
    expect(proEnrollment.progress).toBe(0);
    expect(proEnrollment.completedLessons).toEqual([exercise.id]);
  });
});

describe("Carrière au téléphone (Modèle B, lot B5)", () => {
  const storage = fakeStorage();
  const png = { name: "photo.png", bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]) };

  it("une réalisation garde son lien quand le formulaire ne l'envoie pas, et la couverture est sa première photo", async () => {
    const user = await talent({ key: "career.portfolio.level", value: "standard" });
    const input = projectSchema.parse({
      title: "Réalisation fictive",
      context: "Un tableau imaginaire",
      link: "https://exemple.test/tableau",
    });
    const id = await saveProject(db, storage, user.id, input, [png]);
    const read = async () => {
      const document = await db.document.findUniqueOrThrow({
        where: { id },
        select: { id: true, title: true, content: true },
      });
      return parseProject(document)!;
    };
    expect((await read()).link).toBe("https://exemple.test/tableau");
    expect(projectCover(await read())).toBe(`/api/projets/${id}/0`);
    // The older form (« Mon profil » on a computer) sends no link: it stays.
    const kept = (await read()).files.map((file) => file.key);
    await saveProject(
      db,
      storage,
      user.id,
      projectSchema.parse({ title: "Renommée", keep: kept }),
      [],
      id,
    );
    expect((await read()).link).toBe("https://exemple.test/tableau");
    // An empty field removes it.
    await saveProject(
      db,
      storage,
      user.id,
      projectSchema.parse({ title: "Renommée", link: "" }),
      [],
      id,
    );
    expect((await read()).link).toBeNull();
    expect(projectCover(await read())).toBeNull();
    expect(projectSchema.safeParse({ title: "x", link: "pas un lien" }).success).toBe(false);
  });

  it("Orbi sans modèle rédige une réalisation avec les mots de la personne", () => {
    expect(rewriteTemplate("project", "tableau de bord des ventes. alertes de stock")).toBe(
      "Tableau de bord des ventes. Alertes de stock.",
    );
  });
});
