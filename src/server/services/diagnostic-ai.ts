/**
 * Personalized diagnostic (partie 08 § 8.9 `diagnostic`): the fixed rules give the scores, the
 * model writes a summary, strengths and roles from the answers (and the profile only when
 * the talent ticked « Utiliser mon profil »). Without the model, the rules' result is kept.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { AiError, runAi } from "@/server/ai";
import { z } from "zod";
import { mergePersonalized, personalizedOutputSchema, type DiagnosticV2 } from "./diagnostic";
import {
  choiceAnswers,
  FOLLOW_UPS,
  ruleFollowUps,
  SKILLS_ASSESSED,
  type Answers,
  type Draft,
} from "./diagnostic-scoring";
import { demandedSkills } from "./diagnostic-store";

export const DIAGNOSTIC_GATE = { key: "career.diagnostic.level", levels: ["personalized"] };

const SYSTEM = [
  "Tu es le conseiller carrière de Jumanly, plateforme d'emploi africaine. Tu écris en français simple et bienveillant, en vouvoyant.",
  "À partir des réponses d'un questionnaire (et parfois d'un profil), tu rédiges un bilan court :",
  "- summary : 3 à 5 phrases, concrètes, sans flatterie ni promesse d'emploi ;",
  "- strengths : 2 à 4 atouts, chacun appuyé sur une réponse ou un élément du profil ;",
  "- roles : 2 à 4 métiers à explorer cohérents avec les réponses ;",
  "- priorities et steps : choisis dans les listes fournies, 3 au plus ;",
  "- miniPlan : pour chaque priorité retenue, une action gratuite à faire cette semaine (une phrase, à l'impératif), réalisable sans abonnement : profil, CV, formations gratuites, candidatures, réseau.",
  "Les réponses aux questions de relance (followUps) précisent les autres réponses : tiens-en compte.",
  "Les notes sur 100 sont calculées par des règles fixes : tu ne les modifies pas, tu les expliques.",
  "N'invente aucun fait. N'utilise et ne mentionne jamais : âge, genre, photo, origine, nationalité, religion, situation familiale, santé.",
].join("\n");

/** The profile, as the matching sees it: no name, photo, age or address (CLAUDE.md § 4). */
async function profileFacts(db: PrismaClient, userId: string) {
  const profile = await db.talentProfile.findUnique({
    where: { userId },
    select: {
      headline: true,
      summary: true,
      targetJob: true,
      skills: { select: { level: true, verified: true, skill: { select: { name: true } } } },
      experiences: { select: { title: true, type: true, startDate: true, endDate: true } },
      educations: { select: { degree: true, level: true, field: true } },
    },
  });
  if (!profile) return null;
  return {
    headline: profile.headline,
    summary: profile.summary,
    targetJob: profile.targetJob,
    skills: profile.skills.map((item) => ({
      name: item.skill.name,
      level: item.level,
      verified: item.verified,
    })),
    experiences: profile.experiences.map((item) => ({
      title: item.title,
      type: item.type,
      from: item.startDate.toISOString().slice(0, 7),
      to: item.endDate?.toISOString().slice(0, 7) ?? null,
    })),
    educations: profile.educations,
  };
}

/** Labels of the coded answers, so that the model reads words rather than codes. */
export type AnswerLabels = (question: string, code: string) => string;

/** Beyond 25 s the rules' result is kept and no credit is spent (docs/experience-animee § 5.4). */
export const DIAGNOSTIC_AI_TIMEOUT_MS = 25_000;

export async function personalizedDiagnostic(
  db: PrismaClient,
  userId: string,
  answers: Answers,
  base: DiagnosticV2,
  label: AnswerLabels,
) {
  const said = (question: keyof typeof choiceAnswers, code: string | undefined) =>
    code ? label(question, code) : null;
  const facts = {
    situation: said("situation", answers.situation),
    goal: said("goal", answers.goal),
    targetRole: answers.targetRole,
    familiarityWithRole: said("familiarity", answers.familiarity),
    sectors: answers.sectors,
    topSkills: answers.topSkills,
    skillsToBuild: answers.skillsToBuild,
    selfAssessedSkills: answers.skillChecks.map((item) => ({
      skill: item.skill,
      levelOutOf4: item.level,
      proof: label("skillProof", item.proof),
    })),
    languages: answers.languages,
    digitalTools: answers.digital,
    experience: said("experience", answers.experience),
    education: answers.education,
    achievement: answers.achievement,
    cvStatus: said("cvStatus", answers.cvStatus),
    coverLetter: said("coverLetter", answers.coverLetter),
    onlineProfile: said("onlineProfile", answers.onlineProfile),
    interviewConfidenceOutOf5: answers.confidence,
    interviewsLast6Months: said("interviews", answers.interviews),
    pitch: said("pitch", answers.pitch),
    applications: said("applications", answers.applications),
    obstacle: said("obstacle", answers.obstacle),
    weeklyTime: said("time", answers.time),
    mobility: said("mobility", answers.mobility),
    workMode: said("workMode", answers.workMode),
    contactsThisWeek: said("contacts", answers.contacts),
    values: answers.values.map((code) => label("values", code)),
    workStyle: said("workStyle", answers.workStyle),
    feedback: answers.feedback,
    horizon: answers.horizon,
    followUps: (answers.followUps ?? []).filter((item) => item.answer.trim()),
  };
  const scores = {
    score: base.score,
    stage: base.stage,
    dimensions: base.dimensions.map((item) => ({ key: item.key, score: item.score })),
    priorities: base.priorities,
  };
  const profile = answers.useProfile ? await profileFacts(db, userId) : null;
  try {
    const run = await runAi(db, {
      userId,
      feature: "diagnostic",
      gate: DIAGNOSTIC_GATE,
      system: SYSTEM,
      prompt: [
        "Réponses au questionnaire (JSON) :",
        JSON.stringify(facts),
        profile ? `Profil (JSON) :\n${JSON.stringify(profile)}` : "Profil : non partagé.",
        `Notes calculées par des règles fixes, à ne pas modifier (JSON) :\n${JSON.stringify(scores)}`,
        "priorities possibles : role, skills, experience, cv, interview, search, network.",
        "steps possibles : profile, cv, skills, interview, jobs, network, role.",
      ].join("\n\n"),
      schema: personalizedOutputSchema,
      timeoutMs: DIAGNOSTIC_AI_TIMEOUT_MS,
      template: () => ({
        summary: "",
        strengths: [],
        priorities: base.priorities,
        roles: base.roles,
        steps: base.steps,
        miniPlan: [],
      }),
    });
    if (run.source !== "ai") return { level: "simple" as const, result: base };
    return { level: "personalized" as const, result: mergePersonalized(base, run.output) };
  } catch (error) {
    if (error instanceof AiError)
      return { level: "simple" as const, result: base, error: error.code };
    throw error;
  }
}

export type DiagnosticOutcome = Awaited<ReturnType<typeof personalizedDiagnostic>>;
export const asJson = (value: unknown) => value as Prisma.InputJsonValue;

// ─── Follow-up questions (docs/experience-animee § 5.3, personalized level) ──

const FOLLOW_UP_SYSTEM = [
  "Tu es le conseiller carrière de Jumanly, plateforme d'emploi africaine. Tu écris en français simple et bienveillant, en vouvoyant.",
  `Tu poses exactement ${FOLLOW_UPS} questions de relance, courtes (moins de 200 caractères), ouvertes, chacune sur une réponse précise du questionnaire qui reste vague ou incomplète (ex. après une réalisation vague : « Quel a été le résultat concret ? »).`,
  "Ne pose aucune question sur l'âge, le genre, l'origine, la nationalité, la religion, la situation familiale, la santé ou le handicap. Pas de question fermée par oui ou non.",
].join("\n");

export const followUpOutputSchema = z.object({ questions: z.array(z.string()) });

/**
 * Two follow-up questions written by Jumanly Intelligence from the answers (1 credit, consent and
 * entitlement checked by `runAi`). Without the model (refused, unavailable, no credit), the
 * rules' questions are asked and nothing is spent.
 */
export async function followUpQuestions(
  db: PrismaClient,
  userId: string,
  draft: Draft,
  ruleText: (item: { code: string; skill?: string }) => string,
  label: AnswerLabels,
) {
  const fallback = ruleFollowUps(draft).map(ruleText);
  const said = (question: keyof typeof choiceAnswers, code: string | undefined) =>
    code ? label(question, code) : null;
  const facts = {
    situation: said("situation", draft.situation),
    goal: said("goal", draft.goal),
    targetRole: draft.targetRole,
    topSkills: draft.topSkills,
    selfAssessedSkills: (draft.skillChecks ?? []).map((item) => ({
      skill: item.skill,
      levelOutOf4: item.level,
      proof: label("skillProof", item.proof),
    })),
    experience: said("experience", draft.experience),
    achievement: draft.achievement,
    pitch: said("pitch", draft.pitch),
    obstacle: said("obstacle", draft.obstacle),
    feedback: draft.feedback,
    horizon: draft.horizon,
  };
  try {
    const run = await runAi(db, {
      userId,
      feature: "diagnostic_followup",
      gate: DIAGNOSTIC_GATE,
      system: FOLLOW_UP_SYSTEM,
      prompt: ["Réponses au questionnaire (JSON) :", JSON.stringify(facts)].join("\n\n"),
      schema: followUpOutputSchema,
      timeoutMs: DIAGNOSTIC_AI_TIMEOUT_MS,
      template: () => ({ questions: fallback }),
    });
    const questions = run.output.questions
      .map((question) => question.trim().slice(0, 240))
      .filter(Boolean)
      .slice(0, FOLLOW_UPS);
    return { source: run.source, questions: questions.length > 0 ? questions : fallback };
  } catch (error) {
    if (error instanceof AiError) return { source: "rules" as const, questions: fallback };
    throw error;
  }
}

// ─── Any job (31/10/2026): Orbi prepares the skills to assess ────────────────

const DOMAIN_SYSTEM = [
  "Tu es le conseiller carrière de Jumanly, plateforme d'emploi africaine.",
  `On te donne un métier visé. Tu réponds avec le domaine du métier (2 à 4 mots) et exactement ${SKILLS_ASSESSED} compétences professionnelles clés qu'un recruteur attend pour ce métier : concrètes, vérifiables (savoir-faire, techniques, outils, normes), jamais des qualités vagues comme « motivation » ou « dynamisme ».`,
  "Chaque compétence tient en 1 à 4 mots, en français, sans phrase. Si le texte n'est pas un métier, renvoie une liste vide.",
  "Ne mentionne jamais âge, genre, origine, nationalité, religion, situation familiale, santé ou handicap.",
].join("\n");

export const domainOutputSchema = z.object({
  domain: z.string(),
  skills: z.array(z.string()),
});

const DOMAIN_TTL_MS = 24 * 3_600_000;
/** The same job asked again (the flow, then the analysis) does not call the model twice. */
const domainCache = new Map<string, { skills: string[]; at: number }>();

/**
 * The key skills of a job Jumanly does not know yet, proposed by Orbi (no credit, consent
 * checked and the call logged by `runAi`). The model only chooses which skills to ask about:
 * the levels are the talent's answers and the scores stay those of the fixed rules
 * (règle d'or 3). Without the model or the consent, nothing: the talent names their skills.
 */
export async function domainSkills(db: PrismaClient, userId: string, role: string) {
  const key = role.trim().toLowerCase().replace(/\s+/g, " ");
  const cached = domainCache.get(key);
  if (cached && Date.now() - cached.at < DOMAIN_TTL_MS) return cached.skills;
  try {
    const run = await runAi(db, {
      userId,
      feature: "diagnostic_domain",
      system: DOMAIN_SYSTEM,
      prompt: `Métier visé : ${role.trim().slice(0, 120)}`,
      schema: domainOutputSchema,
      timeoutMs: 10_000,
      maxTokens: 300,
      template: () => ({ domain: "", skills: [] }),
    });
    const skills = [
      ...new Set(
        run.output.skills
          .map((skill) => skill.trim().replace(/[.;]+$/, ""))
          .filter((skill) => skill.length >= 2 && skill.length <= 60),
      ),
    ].slice(0, SKILLS_ASSESSED);
    if (run.source === "ai") {
      if (domainCache.size > 500) domainCache.clear();
      domainCache.set(key, { skills, at: Date.now() });
    }
    return skills;
  } catch (error) {
    if (error instanceof AiError) return [];
    throw error;
  }
}

/**
 * The skills of the diagnostic for any target job: Jumanly's job families, then real offers,
 * then Orbi (`scope: "ai"`) when they do not know the job.
 */
export async function diagnosticSkills(db: PrismaClient, userId: string, role: string) {
  const found = await demandedSkills(db, role);
  if (!role.trim() || found.field || found.skills.length >= SKILLS_ASSESSED)
    return { ...found, ai: false };
  const proposed = await domainSkills(db, userId, role);
  if (proposed.length === 0) return { ...found, ai: false };
  return {
    ...found,
    skills: [...new Set([...found.skills, ...proposed])].slice(0, SKILLS_ASSESSED),
    ai: true,
  };
}
