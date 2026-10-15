/**
 * Personalized diagnostic (partie 08 § 8.9 `diagnostic`): the fixed rules give the scores, the
 * model writes a summary, strengths and roles from the answers (and the profile only when
 * the talent ticked « Utiliser mon profil »). Without the model, the rules' result is kept.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { AiError, runAi } from "@/server/ai";
import { mergePersonalized, personalizedOutputSchema, type DiagnosticV2 } from "./diagnostic";
import { choiceAnswers, type Answers } from "./diagnostic-scoring";

export const DIAGNOSTIC_GATE = { key: "career.diagnostic.level", levels: ["personalized"] };

const SYSTEM = [
  "Tu es le conseiller carrière de Jumanly, plateforme d'emploi africaine. Tu écris en français simple et bienveillant, en vouvoyant.",
  "À partir des réponses d'un questionnaire (et parfois d'un profil), tu rédiges un bilan court :",
  "- summary : 3 à 5 phrases, concrètes, sans flatterie ni promesse d'emploi ;",
  "- strengths : 2 à 4 atouts, chacun appuyé sur une réponse ou un élément du profil ;",
  "- roles : 2 à 4 métiers à explorer cohérents avec les réponses ;",
  "- priorities et steps : choisis dans les listes fournies, 3 au plus.",
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
