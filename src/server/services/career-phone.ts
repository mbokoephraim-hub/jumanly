import { ABOUT_TEXT_MAX } from "@/lib/profile-about";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { AiError, runAi } from "@/server/ai";
import { resolvePlan, type ResolvedPlan } from "@/server/entitlements";
import { talentAttestations } from "./attestations";
import { careerTraining } from "./career-training";
import { listApplications, talentStatus, type TalentApplicationStatus } from "./applications";
import { stageFor, type Stage, stages } from "./diagnostic-scoring";
import { isJobOpen, openJobWhere } from "./jobs";
import { followedCourses } from "./learn-space";
import { listProjects, type PortfolioProject } from "./portfolio";
import { parseCv } from "./cv";
import { cvScore, targetSkillsFor } from "./cv-coach";
import { personProfile } from "./person-profile";
import { completeness, getFullProfile, parseProfileLanguages } from "./profile";

/**
 * What the Carrière tab shows on the phone (Modèle B, lot B5, planche Carrière): the person's
 * profile and how complete it is, their CVs, their achievements, where they stand and their
 * applications. Only the person's own data; nothing here is shown to anyone else.
 */

/** Four steps of an application on the phone: sent, read, in progress, decided. */
export function applicationBars(status: TalentApplicationStatus) {
  switch (status) {
    case "sent":
    case "jobClosed":
      return 1;
    case "viewed":
      return 2;
    case "shortlisted":
    case "test":
    case "interview":
      return 3;
    default:
      return 4;
  }
}

/**
 * The skill most asked for by the open offers that the person does not have yet, and how many
 * offers ask for it (« Ajoutez Power BI à vos compétences »). Counted, never guessed.
 */
export async function skillToAdd(db: PrismaClient, owned: string[], now = new Date()) {
  const rows = await db.jobSkill.findMany({
    where: {
      importance: "required",
      skillId: { notIn: owned },
      job: openJobWhere(now),
    },
    select: { skillId: true, skill: { select: { name: true } } },
  });
  const counts = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    const entry = counts.get(row.skillId) ?? { name: row.skill.name, count: 0 };
    entry.count += 1;
    counts.set(row.skillId, entry);
  }
  const best = [...counts.entries()].sort(
    (a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name),
  )[0];
  return best ? { id: best[0], name: best[1].name, count: best[1].count } : null;
}

/** Skills the open offers ask for most, that the person does not have (sheet « Ajouter »). */
export async function suggestedSkills(db: PrismaClient, owned: string[], take = 6) {
  const rows = await db.jobSkill.groupBy({
    by: ["skillId"],
    where: { skillId: { notIn: owned }, job: openJobWhere(new Date()) },
    _count: { skillId: true },
    orderBy: { _count: { skillId: "desc" } },
    take,
  });
  const skills = await db.skill.findMany({
    where: { id: { in: rows.map((row) => row.skillId) } },
    select: { id: true, name: true },
  });
  const names = new Map(skills.map((skill) => [skill.id, skill.name]));
  return rows.flatMap((row) => {
    const name = names.get(row.skillId);
    return name ? [{ id: row.skillId, name }] : [];
  });
}

/** The first photo of a project (its files are served by `/api/projets/[id]/[n]`). */
export function projectCover(project: PortfolioProject) {
  const index = project.files.findIndex((file) => file.type.startsWith("image/"));
  return index < 0 ? null : `/api/projets/${project.id}/${index}`;
}

/**
 * The rank of a paid plan among the paid plans of its family, cheapest first, 1 to 3 (Ephraïm
 * 29/10/2026: one icon per paid level next to the name, none for free). Read from the prices, so
 * no plan is named here (CLAUDE.md § 2). 0 for a free plan or none.
 */
export async function planTier(
  db: PrismaClient,
  plan: Pick<ResolvedPlan, "family" | "priceCents"> | null,
): Promise<PlanTier> {
  if (!plan || !plan.priceCents) return 0;
  const cheaper = await db.plan.count({
    where: {
      family: plan.family,
      active: true,
      isPublic: true,
      priceCents: { gt: 0, lt: plan.priceCents },
    },
  });
  return Math.min(cheaper + 1, 3) as PlanTier;
}

export type PlanTier = 0 | 1 | 2 | 3;

export async function careerHome(db: PrismaClient, userId: string, now = new Date()) {
  const profile = await getFullProfile(db, userId);
  const owned = profile.skills.map((row) => row.skillId);
  const [
    cvs,
    projects,
    applications,
    courses,
    attestations,
    diagnostic,
    suggestion,
    addSkills,
    jobCities,
    plan,
    savedJob,
    person,
    targets,
  ] = await Promise.all([
    db.document.findMany({
      where: { profileId: profile.id, kind: "cv" },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        templateId: true,
        isPrimary: true,
        updatedAt: true,
        fileType: true,
        colorTag: true,
        adaptedForJobId: true,
        content: true,
        style: true,
      },
    }),
    listProjects(db, profile.id),
    listApplications(db, userId),
    followedCourses(db, userId),
    talentAttestations(db, userId),
    db.careerDiagnostic.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { result: true },
    }),
    skillToAdd(db, owned, now),
    suggestedSkills(db, owned, 6),
    db.job.groupBy({
      by: ["city"],
      where: openJobWhere(now),
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 6,
    }),
    resolvePlan(db, { type: "user", id: userId }, now),
    db.savedJob.findFirst({
      where: { userId, job: { status: "published" } },
      orderBy: { createdAt: "desc" },
      select: { job: { select: { id: true, organization: { select: { name: true } } } } },
    }),
    // The head of Carrière is the person's own profile, as others see it (docs/carriere-v3).
    personProfile(db, userId, userId, "candidate"),
    targetSkillsFor(db, userId),
  ]);
  const complete = completeness(profile);
  const tier = await planTier(db, plan);

  // Where the person stands: the stage of their last diagnostic, none before the first one.
  const score = (diagnostic?.result as { score?: unknown } | null)?.score;
  const stage: Stage | null = typeof score === "number" ? stageFor(score) : null;
  const nextStage = stage ? (stages[stages.indexOf(stage) + 1] ?? null) : null;

  const uses = new Map<string, number>();
  for (const application of applications) {
    const id = (application.cvSnapshot as { documentId?: string } | null)?.documentId;
    if (id) uses.set(id, (uses.get(id) ?? 0) + 1);
  }

  const rows = applications.map((application) => {
    const status = talentStatus(application, now);
    const interview = application.interviews.find((item) => item.startsAt && item.startsAt > now);
    return {
      id: application.id,
      title: application.job.title,
      company: application.job.organization.name,
      jobSlug: application.job.slug,
      createdAt: application.createdAt,
      viewedAt: application.viewedAt,
      status,
      bars: applicationBars(status),
      interviewAt: interview?.startsAt ?? null,
      open: isJobOpen(application.job, now),
      /** The score shown when the person applied, frozen with the application. */
      score: application.matchScore,
    };
  });
  const active = rows.filter(
    (row) => !["withdrawn", "notSelected", "hired", "jobClosed"].includes(row.status),
  );
  const upcoming = rows
    .filter((row) => row.interviewAt)
    .sort((a, b) => a.interviewAt!.getTime() - b.interviewAt!.getTime())[0];

  const training = await careerTraining(
    db,
    userId,
    { applications: rows, ownedSkillIds: owned },
    now,
  );

  const primary = cvs.find((cv) => cv.isPrimary) ?? cvs[0] ?? null;
  const adapt =
    primary && savedJob && !cvs.some((cv) => cv.adaptedForJobId === savedJob.job.id)
      ? {
          cvId: primary.id,
          cvTitle: primary.title,
          jobId: savedJob.job.id,
          company: savedJob.job.organization.name,
        }
      : null;

  return {
    userId,
    portfolioSlug: profile.portfolioPublic ? profile.portfolioSlug : null,
    user: profile.user,
    person,
    profile: {
      banner: profile.banner,
      handle: profile.handle,
      headline: profile.headline,
      summary: profile.summary,
      targetJob: profile.targetJob,
      availability: profile.availability,
      desiredContracts: profile.desiredContracts,
      visibility: profile.visibility,
      desiredLocations: profile.desiredLocations,
      languages: parseProfileLanguages(profile.languages),
      skills: profile.skills.map((row) => ({ id: row.skillId, name: row.skill.name })),
      experiences: profile.experiences,
      educations: profile.educations,
    },
    percent: complete.percent,
    missing: complete.missing,
    plan: plan?.planName ?? null,
    planTier: tier,
    suggestion,
    /** « Ajouter des compétences »: what the open offers ask for most. */
    addSkills,
    /** « Où je veux travailler »: the cities with the most open offers. */
    jobCities: jobCities.map((row) => row.city).filter(Boolean),
    attestations: attestations.map((item) => ({
      id: item.id,
      code: item.code,
      title: item.courseTitle,
      issuedAt: item.issuedAt,
    })),
    cvs: cvs.map((cv) => ({
      id: cv.id,
      title: cv.title,
      templateId: cv.templateId,
      isPrimary: cv.isPrimary,
      updatedAt: cv.updatedAt,
      uses: uses.get(cv.id) ?? 0,
      style: cv.style,
      /** An imported CV kept as its file (pdf, docx, image), null for a CV made in Jumanly. */
      fileType: cv.fileType,
      /** The colour the talent gave it in the library, or null. */
      colorTag: cv.colorTag,
      /** The CV's score out of 100 (fixed rules, partie 08 § 8.9), with its « Pourquoi ? ». */
      score: cvScore(parseCv(cv.content), targets.skills).total,
    })),
    adapt,
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      tool: project.skills[0] ?? null,
      skills: project.skills.slice(0, 3),
      photos: project.files.filter((file) => file.type.startsWith("image/")).length,
      cover: projectCover(project),
      files: project.files.length,
      featured: project.visible,
    })),
    progression: {
      stage,
      nextStage,
      courses: { done: courses.filter((course) => course.finished).length, all: courses.length },
      applications: applications.length,
      upcoming: upcoming ? { id: upcoming.id, at: upcoming.interviewAt! } : null,
    },
    /** « Mes entraînements »: what to prepare and the follow-up of the simulations. */
    training,
    applications: rows,
    activeApplications: active.length,
  };
}

export type CareerHome = Awaited<ReturnType<typeof careerHome>>;

const rewriteOutput = z.object({ text: z.string() });

export type RewriteKind = "about" | "experience" | "project";

const REWRITE_SYSTEM = {
  about: [
    "Tu es Orbi, l'assistant de Jumanly. Tu réécris le texte « À propos » d'un profil en français simple, en 2 ou 3 phrases, à la première personne, pour des recruteurs, en 400 caractères au plus.",
    "Commence par un verbe d'action ou par le métier, termine par l'objectif.",
  ],
  project: [
    "Tu es Orbi, l'assistant de Jumanly. Tu rédiges la description d'une réalisation du portfolio en français simple, en 2 ou 3 phrases : ce qui a été fait, avec quoi, pour quel résultat.",
  ],
  experience: [
    "Tu es Orbi, l'assistant de Jumanly. Tu corriges les fautes de la description d'une expérience et la mets en forme en réalisations clés : 3 à 4 lignes si le texte le permet (sans rien inventer), une réalisation par ligne, chacune commençant par un verbe d'action.",
  ],
} as const;

const REWRITE_RULES = [
  "Règles strictes :",
  "- Utilise uniquement les faits du texte fourni.",
  "- N'invente jamais d'expérience, de diplôme, de compétence, d'entreprise ni de chiffre.",
  "- N'utilise et ne mentionne jamais : âge, genre, photo, origine, religion, situation familiale, santé.",
  'Réponds en JSON : {"text": "…"}.',
];

/** Without a model: the person's own words, tidied (spaces, capitals, one line per sentence). */
export function rewriteTemplate(kind: RewriteKind, text: string) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim().replace(/^[-•·]\s*/, ""))
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .map((part) => (/[.!?]$/.test(part) ? part : `${part}.`));
  return kind === "experience" ? sentences.join("\n") : sentences.join(" ");
}

/**
 * Orbi's version of a text of the profile (« Réécrire », « Améliorer »): consent, right and credits
 * checked by `runAi`; an AiError code when it cannot run, `same` when nothing changes.
 */
export async function rewriteCareerText(
  db: PrismaClient,
  userId: string,
  input: { kind: RewriteKind; text: string; title?: string },
): Promise<string | { error: AiError["code"] | "empty" | "same" }> {
  const text = input.text.trim();
  if (text.length < 10) return { error: "empty" };
  try {
    const run = await runAi(db, {
      userId,
      feature: "proofread",
      system: [...REWRITE_SYSTEM[input.kind], ...REWRITE_RULES].join("\n"),
      prompt: [
        input.title ? `${input.kind === "project" ? "Réalisation" : "Poste"} : ${input.title}` : "",
        "Texte :",
        text,
      ].join("\n"),
      schema: rewriteOutput,
      template: () => ({ text: rewriteTemplate(input.kind, text) }),
    });
    const proposed = run.output.text
      .trim()
      .slice(0, input.kind === "about" ? ABOUT_TEXT_MAX : 3000);
    return proposed && proposed !== text ? proposed : { error: "same" };
  } catch (error) {
    if (error instanceof AiError) return { error: error.code };
    throw error;
  }
}
