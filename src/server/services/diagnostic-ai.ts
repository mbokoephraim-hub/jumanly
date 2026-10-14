/**
 * Personalized diagnostic (partie 08 § 8.9 `diagnostic`): the simplified rules give the base,
 * the model writes a summary, strengths and roles from the answers (and the profile only when
 * the talent ticked « Utiliser mon profil »). Without the model, the rules' result is kept.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { AiError, runAi } from "@/server/ai";
import {
  mergePersonalized,
  personalizedOutputSchema,
  simpleDiagnostic,
  type PersonalAnswers,
  type SimpleAnswers,
} from "./diagnostic";

export const DIAGNOSTIC_GATE = { key: "career.diagnostic.level", levels: ["personalized"] };

const SYSTEM = [
  "Tu es le conseiller carrière de Jumanly, plateforme d'emploi africaine. Tu écris en français simple et bienveillant, en vouvoyant.",
  "À partir des réponses d'un questionnaire (et parfois d'un profil), tu rédiges un bilan court :",
  "- summary : 3 à 5 phrases, concrètes, sans flatterie ni promesse d'emploi ;",
  "- strengths : 2 à 4 atouts, chacun appuyé sur une réponse ou un élément du profil ;",
  "- roles : 2 à 4 métiers à explorer cohérents avec les réponses ;",
  "- priorities et steps : choisis dans les listes fournies, 3 au plus.",
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

export async function personalizedDiagnostic(
  db: PrismaClient,
  userId: string,
  simple: SimpleAnswers,
  personal: PersonalAnswers,
  label: AnswerLabels,
) {
  const base = simpleDiagnostic(simple);
  const answers = {
    situation: label("situation", simple.situation),
    experience: label("experience", simple.experience),
    education: simple.education,
    goal: label("goal", simple.goal),
    targetRole: simple.targetRole,
    topSkills: simple.topSkills,
    confidenceOutOf5: simple.confidence,
    cvStatus: label("cvStatus", simple.cvStatus),
    applications: label("applications", simple.applications),
    obstacle: label("obstacle", simple.obstacle),
    weeklyTime: label("time", simple.time),
    mobility: label("mobility", simple.mobility),
    achievement: personal.achievement,
    values: personal.values.map((code) => label("values", code)),
    workStyle: label("workStyle", personal.workStyle),
    feedback: personal.feedback,
    languages: personal.languages,
    digitalTools: personal.digital,
    horizon: personal.horizon,
  };
  const profile = personal.useProfile ? await profileFacts(db, userId) : null;
  try {
    const run = await runAi(db, {
      userId,
      feature: "diagnostic",
      gate: DIAGNOSTIC_GATE,
      system: SYSTEM,
      prompt: [
        "Réponses au questionnaire (JSON) :",
        JSON.stringify(answers),
        profile ? `Profil (JSON) :\n${JSON.stringify(profile)}` : "Profil : non partagé.",
        `Bilan par règles fixes, à affiner (JSON) :\n${JSON.stringify(base)}`,
        "priorities possibles : role, skills, cv, interview, search, network.",
        "steps possibles : profile, cv, skills, interview, jobs, network, role.",
      ].join("\n\n"),
      schema: personalizedOutputSchema,
      template: () => ({
        summary: "",
        readiness: base.readiness,
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
