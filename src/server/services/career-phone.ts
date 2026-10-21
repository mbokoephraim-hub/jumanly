import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { AiError, runAi } from "@/server/ai";
import { resolvePlan } from "@/server/entitlements";
import { talentAttestations } from "./attestations";
import { listApplications, talentStatus, type TalentApplicationStatus } from "./applications";
import { stageFor, type Stage, stages } from "./diagnostic-scoring";
import { isJobOpen, openJobWhere } from "./jobs";
import { followedCourses } from "./learn-space";
import { listProjects } from "./portfolio";
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
        adaptedForJobId: true,
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
  ]);
  const complete = completeness(profile);

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
    };
  });
  const active = rows.filter(
    (row) => !["withdrawn", "notSelected", "hired", "jobClosed"].includes(row.status),
  );
  const upcoming = rows
    .filter((row) => row.interviewAt)
    .sort((a, b) => a.interviewAt!.getTime() - b.interviewAt!.getTime())[0];

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
    profile: {
      headline: profile.headline,
      summary: profile.summary,
      targetJob: profile.targetJob,
      availability: profile.availability,
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
    })),
    adapt,
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      tool: project.skills[0] ?? null,
      photos: project.media.length,
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
    applications: rows,
    activeApplications: active.length,
  };
}

export type CareerHome = Awaited<ReturnType<typeof careerHome>>;

const rewriteOutput = z.object({ text: z.string() });

const REWRITE_SYSTEM = {
  about: [
    "Tu es Orbi, l'assistant de Jumanly. Tu réécris le texte « À propos » d'un profil en français simple, en 2 ou 3 phrases, à la première personne, pour des recruteurs.",
    "Commence par un verbe d'action ou par le métier, termine par l'objectif.",
  ],
  experience: [
    "Tu es Orbi, l'assistant de Jumanly. Tu corriges les fautes de la description d'une expérience et la mets en forme : 2 à 4 lignes, une réalisation par ligne, chacune commençant par un verbe d'action.",
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
export function rewriteTemplate(kind: "about" | "experience", text: string) {
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
  input: { kind: "about" | "experience"; text: string; title?: string },
): Promise<string | { error: AiError["code"] | "empty" | "same" }> {
  const text = input.text.trim();
  if (text.length < 10) return { error: "empty" };
  try {
    const run = await runAi(db, {
      userId,
      feature: "proofread",
      system: [...REWRITE_SYSTEM[input.kind], ...REWRITE_RULES].join("\n"),
      prompt: [input.title ? `Poste : ${input.title}` : "", "Texte :", text].join("\n"),
      schema: rewriteOutput,
      template: () => ({ text: rewriteTemplate(input.kind, text) }),
    });
    const proposed = run.output.text.trim().slice(0, input.kind === "about" ? 1000 : 3000);
    return proposed && proposed !== text ? proposed : { error: "same" };
  } catch (error) {
    if (error instanceof AiError) return { error: error.code };
    throw error;
  }
}
