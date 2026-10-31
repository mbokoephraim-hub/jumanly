/**
 * Career diagnostic, scoring `diagnostic_scoring_v3` (partie 08 § 8.11, docs/experience-animee
 * § 5.3, shortened to about ten questions on 31/10/2026, see
 * docs/decisions/2026-10-31-diagnostic-dix-questions.md): six dimensions scored out of 100 by
 * fixed rules, a global level on four stages, and the adaptive questions. Pure functions, shared
 * by the server (which always recomputes) and the questionnaire. The AI never scores (règle d'or 3).
 */
import { z } from "zod";

export const SCORING_VERSION = "diagnostic_scoring_v3";

export const dimensions = [
  "clarity",
  "skills",
  "experience",
  "tools",
  "interviews",
  "search",
] as const;
export type Dimension = (typeof dimensions)[number];

export const stages = ["discovery", "building", "ready", "competitive"] as const;
export type Stage = (typeof stages)[number];

/** Découverte 0–39, Construction 40–59, Prêt 60–79, Compétitif 80–100. */
export function stageFor(score: number): Stage {
  return score >= 80
    ? "competitive"
    : score >= 60
      ? "ready"
      : score >= 40
        ? "building"
        : "discovery";
}

/** Lower bound of each stage, for the drawn scale. */
export const stageFloors: Record<Stage, number> = {
  discovery: 0,
  building: 40,
  ready: 60,
  competitive: 80,
};

const choice = (count: number) => Array.from({ length: count }, (_, index) => `a${index + 1}`);

/** Question → answer codes (texts `career.diagnostic.q.<id>.a<n>`). */
export const choiceAnswers = {
  situation: choice(6),
  goal: choice(6),
  familiarity: choice(4),
  companies: choice(3),
  experience: choice(5),
  quantified: choice(3),
  cvStatus: choice(3),
  coverLetter: choice(3),
  onlineProfile: choice(3),
  interviews: choice(4),
  pitch: choice(3),
  applications: choice(4),
  obstacle: choice(6),
  time: choice(4),
  mobility: choice(4),
  workMode: choice(4),
  contacts: choice(4),
  skillProof: choice(4),
  workStyle: choice(3),
  values: choice(7),
} as const;
export type ChoiceQuestion = keyof typeof choiceAnswers;

/**
 * The answers shown since 31/10/2026: three or four per question. The other codes stay valid so
 * that earlier diagnostics and drafts still read (« Plus de 5 » now reads a3 for counts).
 */
export const shownAnswers: Partial<Record<ChoiceQuestion, readonly string[]>> = {
  familiarity: ["a1", "a2", "a4"],
  experience: ["a1", "a2", "a3", "a4"],
  interviews: ["a1", "a2", "a3"],
  applications: ["a1", "a2", "a3"],
  contacts: ["a1", "a2", "a3"],
  obstacle: ["a1", "a2", "a3", "a6"],
};

/** « Qu'avez-vous déjà de prêt ? »: several boxes, none is fine. */
export const readyItems = ["cv", "letter", "profile", "portfolio"] as const;
export type ReadyItem = (typeof readyItems)[number];

/** Interview confidence on three answers (stored on the 1–5 scale). */
export const confidenceAnswers = [5, 3, 1] as const;

export const educationAnswers = [
  "none",
  "secondary",
  "vocational",
  "bachelor",
  "master",
  "doctorate",
] as const;

/** Self-assessment levels: Aucun niveau (0), Notions, Intermédiaire, Avancé, Expert. */
export const SKILL_LEVELS = [0, 1, 2, 3, 4] as const;
/** Skills assessed on one screen (the most asked for in the offers of the target job). */
export const SKILLS_ASSESSED = 3;
/** Earlier diagnostics assessed up to five. */
const SKILLS_KEPT = 5;

/**
 * The four answers of each assessed skill, level and proof in one tap: « Pas encore »,
 * « Les bases », « À l'aise », « Je peux le prouver » (texts `q.skills.p<n>`).
 */
export const SKILL_PICKS = [
  { level: 0, proof: "a4" },
  { level: 2, proof: "a4" },
  { level: 3, proof: "a3" },
  { level: 4, proof: "a1" },
] as const;

/** The pick that matches a skill check, for a draft written before 31/10/2026 too. */
export function skillPickOf(check: { level: number; proof: string } | undefined) {
  if (!check) return undefined;
  if (check.level === 0) return 0;
  if ((check.proof === "a1" || check.proof === "a2") && check.level >= 2) return 3;
  return check.level >= 3 ? 2 : 1;
}

const pick = (values: readonly string[]) => z.enum(values as [string, ...string[]]);
const optionalPick = (values: readonly string[]) =>
  z.preprocess((value) => (value === "" ? undefined : value), pick(values).optional());
const text = (max: number) => z.string().trim().max(max).default("");

export const skillCheckSchema = z.object({
  skill: z.string().trim().min(1).max(80),
  /** 0: « Je ne connais pas cette compétence » (no proof asked, « Rien encore » kept). */
  level: z.coerce.number().int().min(0).max(4),
  proof: pick(choiceAnswers.skillProof),
});
export type SkillCheck = z.infer<typeof skillCheckSchema>;

/** Follow-up questions asked by Jumanly Intelligence at the end of the personalized diagnostic. */
export const FOLLOW_UPS = 2;
export const followUpSchema = z.object({
  question: z.string().trim().min(1).max(240),
  answer: text(500),
});
export type FollowUp = z.infer<typeof followUpSchema>;

/** Every answer of the questionnaire. Adaptive questions are optional: rules ignore them when they were not asked. */
export const answersSchema = z.object({
  // 1. Clarté du projet (situation and goal: earlier diagnostics only)
  situation: optionalPick(choiceAnswers.situation),
  goal: optionalPick(choiceAnswers.goal),
  targetRole: text(120),
  sectors: text(200),
  familiarity: optionalPick(choiceAnswers.familiarity),
  companies: optionalPick(choiceAnswers.companies),
  // 2. Compétences
  topSkills: text(200),
  skillsToBuild: text(200),
  skillChecks: z.array(skillCheckSchema).max(SKILLS_KEPT).default([]),
  languages: text(200),
  digital: text(200),
  // 3. Expérience
  experience: pick(choiceAnswers.experience),
  /** From the profile only since 31/10/2026 (not asked). */
  education: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(educationAnswers).optional(),
  ),
  quantified: optionalPick(choiceAnswers.quantified),
  achievement: text(1000),
  // 4. Outils de candidature: what is ready (cvStatus, coverLetter, onlineProfile: earlier ones)
  ready: z.array(pick(readyItems)).max(readyItems.length).default([]),
  cvStatus: optionalPick(choiceAnswers.cvStatus),
  coverLetter: optionalPick(choiceAnswers.coverLetter),
  onlineProfile: optionalPick(choiceAnswers.onlineProfile),
  // 5. Entretiens
  confidence: z.coerce.number().int().min(1).max(5),
  interviews: pick(choiceAnswers.interviews),
  pitch: optionalPick(choiceAnswers.pitch),
  // 6. Recherche active et réseau
  applications: pick(choiceAnswers.applications),
  obstacle: pick(choiceAnswers.obstacle),
  time: optionalPick(choiceAnswers.time),
  mobility: optionalPick(choiceAnswers.mobility),
  workMode: optionalPick(choiceAnswers.workMode),
  contacts: pick(choiceAnswers.contacts),
  // Diagnostic personnalisé
  values: z.array(pick(choiceAnswers.values)).max(3).default([]),
  workStyle: optionalPick(choiceAnswers.workStyle),
  feedback: text(300),
  horizon: text(300),
  /**
   * The two follow-up questions of Jumanly Intelligence (personalized level), asked after the
   * others from the answers so far. Undefined until they were asked; never scored.
   */
  followUps: z.array(followUpSchema).max(FOLLOW_UPS).optional(),
  useProfile: z.boolean().default(false),
});
export type Answers = z.infer<typeof answersSchema>;
/** What the questionnaire holds while the talent answers: anything may still be missing. */
export type Draft = Partial<Answers>;

// ─── Questions, adaptive ─────────────────────────────────────────────────────

type QuestionId = Exclude<keyof Answers, "skillChecks" | "useProfile" | "followUps">;

export type Screen =
  | { id: QuestionId; dimension: Dimension | "more" }
  | { id: "skills"; dimension: "skills"; skills: string[] }
  | { id: `followUp${number}`; dimension: "more"; followUp: string; index: number };

/**
 * About ten questions (Ephraïm, 31/10/2026), three or four answers each. What the profile already
 * says (studies, skills, languages) is read there, not asked again.
 */
const base: { id: QuestionId | "skills"; dimension: Dimension }[] = [
  { id: "targetRole", dimension: "clarity" },
  { id: "familiarity", dimension: "clarity" },
  { id: "skills", dimension: "skills" },
  { id: "experience", dimension: "experience" },
  { id: "ready", dimension: "tools" },
  { id: "confidence", dimension: "interviews" },
  { id: "interviews", dimension: "interviews" },
  { id: "applications", dimension: "search" },
  { id: "contacts", dimension: "search" },
  { id: "obstacle", dimension: "search" },
];

/** Questions that can be left empty. */
export const optionalQuestions: readonly string[] = ["targetRole", "ready", "topSkills"];

/**
 * The screens to show for the answers so far: no question on the target job without one, the
 * assessed skills together on one screen (named by the talent when none is known for the job). The personalized
 * level adds Orbi's two follow-up questions once they are asked.
 */
export function screensFor(draft: Draft, skills: string[], personalized: boolean): Screen[] {
  const hasRole = Boolean(draft.targetRole?.trim());
  const screens: Screen[] = [];
  for (const item of base) {
    if (item.id === "familiarity" && !hasRole) continue;
    if (item.id === "skills") {
      // Always asked: without known skills for the job, the talent names theirs on this screen.
      screens.push({ id: "skills", dimension: "skills", skills: skills.slice(0, SKILLS_ASSESSED) });
      continue;
    }
    screens.push(item as { id: QuestionId; dimension: Dimension });
  }
  if (personalized)
    (draft.followUps ?? [])
      .slice(0, FOLLOW_UPS)
      .forEach((item, index) =>
        screens.push({ id: `followUp${index}`, dimension: "more", followUp: item.question, index }),
      );
  return screens;
}

/**
 * What the rules would ask next, most useful first: a vague achievement, no target job, the
 * obstacle named, a skill without proof, no pitch. Used as the model's template, so the talent
 * gets two questions even when the model is not there.
 */
export function ruleFollowUps(draft: Draft): { code: string; skill?: string }[] {
  const codes: { code: string; skill?: string }[] = [];
  const achievement = (draft.achievement ?? "").trim();
  const worked = draft.experience !== undefined && draft.experience !== "a1";
  if (achievement && (achievement.length < 80 || !/\d/.test(achievement)))
    codes.push({ code: "achievementResult" });
  else if (!achievement && worked) codes.push({ code: "achievementStory" });
  if (!draft.targetRole?.trim()) codes.push({ code: "energy" });
  if (draft.obstacle && draft.obstacle !== "a1") codes.push({ code: "obstacleTried" });
  const unproven = draft.skillChecks?.find((item) => item.proof === "a4" && item.level > 0);
  if (unproven) codes.push({ code: "skillProof", skill: unproven.skill });
  if (draft.pitch === "a2" || draft.pitch === "a3" || (draft.confidence ?? 5) <= 3)
    codes.push({ code: "pitch" });
  codes.push({ code: "nextJob" }, { code: "proudSkill" });
  return codes.slice(0, FOLLOW_UPS);
}

// ─── Barème ──────────────────────────────────────────────────────────────────

export type Reason = { code: string; points: number; max: number };
export type DimensionScore = { key: Dimension; score: number; reasons: Reason[] };

const table = (values: Record<string, number>, answer: string | undefined) =>
  answer ? (values[answer] ?? 0) : 0;

/** Fixed points of each answer (partie 08 § 8.11, about ten questions since 31/10/2026). */
export const POINTS = {
  clarity: {
    targetRole: 40,
    familiarity: { a1: 35, a2: 25, a3: 15, a4: 5 },
    obstacle: 25,
  },
  skills: {
    level: 55,
    proof: 45,
    proofValue: { a1: 1, a2: 0.8, a3: 0.8, a4: 0 } as Record<string, number>,
  },
  experience: {
    experience: { a1: 0, a2: 20, a3: 40, a4: 60, a5: 60 },
    portfolio: 20,
    education: { none: 0, secondary: 6, vocational: 12, bachelor: 16, master: 20, doctorate: 20 },
  },
  tools: { cv: 45, letter: 30, profile: 25 },
  interviews: {
    confidence: 50,
    interviews: { a1: 0, a2: 30, a3: 50, a4: 50 },
  },
  search: {
    applications: { a1: 0, a2: 30, a3: 50, a4: 50 },
    contacts: { a1: 0, a2: 25, a3: 50, a4: 50 },
  },
} as const;

const maxOf = (values: Record<string, number>) => Math.max(...Object.values(values));

function reason(code: string, points: number, max: number): Reason {
  return { code, points: Math.round(points), max };
}

/**
 * The six dimensions for the answers so far: a question not answered yet counts 0. The studies
 * count only when the profile gives them (they are not asked): the dimension is then out of 80,
 * brought back to 100.
 */
export function scoreDimensions(draft: Draft): DimensionScore[] {
  const p = POINTS;
  const hasRole = Boolean(draft.targetRole?.trim());
  const checks = draft.skillChecks ?? [];
  const ready = draft.ready ?? [];
  const confidence = draft.confidence;

  const groups: Record<Dimension, Reason[]> = {
    clarity: [
      reason("targetRole", hasRole ? p.clarity.targetRole : 0, p.clarity.targetRole),
      reason(
        "familiarity",
        hasRole ? table(p.clarity.familiarity, draft.familiarity) : 0,
        maxOf(p.clarity.familiarity),
      ),
      reason(
        "obstacle",
        draft.obstacle && draft.obstacle !== "a1" ? p.clarity.obstacle : 0,
        p.clarity.obstacle,
      ),
    ],
    skills: [
      reason(
        "skillLevels",
        checks.length === 0
          ? 0
          : (p.skills.level *
              checks.reduce((sum, item) => sum + Math.max(0, item.level - 1) / 3, 0)) /
              checks.length,
        p.skills.level,
      ),
      reason(
        "skillProofs",
        checks.length === 0
          ? 0
          : (p.skills.proof *
              checks.reduce((sum, item) => sum + (p.skills.proofValue[item.proof] ?? 0), 0)) /
              checks.length,
        p.skills.proof,
      ),
    ],
    experience: [
      reason(
        "experience",
        table(p.experience.experience, draft.experience),
        maxOf(p.experience.experience),
      ),
      reason(
        "portfolio",
        ready.includes("portfolio") ? p.experience.portfolio : 0,
        p.experience.portfolio,
      ),
      ...(draft.education
        ? [
            reason(
              "education",
              table(p.experience.education, draft.education),
              maxOf(p.experience.education),
            ),
          ]
        : []),
    ],
    tools: [
      reason("cvStatus", ready.includes("cv") ? p.tools.cv : 0, p.tools.cv),
      reason("coverLetter", ready.includes("letter") ? p.tools.letter : 0, p.tools.letter),
      reason("onlineProfile", ready.includes("profile") ? p.tools.profile : 0, p.tools.profile),
    ],
    interviews: [
      reason(
        "confidence",
        confidence ? (p.interviews.confidence * (confidence - 1)) / 4 : 0,
        p.interviews.confidence,
      ),
      reason(
        "interviews",
        table(p.interviews.interviews, draft.interviews),
        maxOf(p.interviews.interviews),
      ),
    ],
    search: [
      reason(
        "applications",
        table(p.search.applications, draft.applications),
        maxOf(p.search.applications),
      ),
      reason("contacts", table(p.search.contacts, draft.contacts), maxOf(p.search.contacts)),
    ],
  };
  return dimensions.map((key) => {
    const points = groups[key].reduce((sum, item) => sum + item.points, 0);
    const max = groups[key].reduce((sum, item) => sum + item.max, 0);
    return {
      key,
      score: max === 0 ? 0 : Math.min(100, Math.round((points * 100) / max)),
      reasons: groups[key],
    };
  });
}

/** Rounded mean of the six dimensions. */
export function globalScore(scores: { score: number }[]) {
  return scores.length === 0
    ? 0
    : Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
}

// ─── Priorités ───────────────────────────────────────────────────────────────

export type Priority = "role" | "skills" | "experience" | "cv" | "interview" | "search" | "network";

/** The weakest dimensions first (ties in the order of the questionnaire), three at most. */
export function prioritiesFor(scores: DimensionScore[], draft: Draft): Priority[] {
  const few = draft.contacts === undefined || draft.contacts === "a1" || draft.contacts === "a2";
  const of: Record<Dimension, Priority> = {
    clarity: "role",
    skills: "skills",
    experience: "experience",
    tools: "cv",
    interviews: "interview",
    search: few ? "network" : "search",
  };
  return [...scores]
    .sort((a, b) => a.score - b.score || dimensions.indexOf(a.key) - dimensions.indexOf(b.key))
    .slice(0, 3)
    .map((item) => of[item.key]);
}

/** A finding per dimension, by band (texts `career.diagnostic.dimension.<key>.finding.<band>`). */
export function bandFor(score: number) {
  return score >= 70 ? ("high" as const) : score >= 40 ? ("mid" as const) : ("low" as const);
}

/** Where the most useful action of each dimension leads. */
export const dimensionLinks: Record<Dimension, string> = {
  clarity: "/app/jobs",
  skills: "/app/learn",
  experience: "/app/career/portfolio",
  tools: "/app/career/cv",
  interviews: "/app/career/entretiens",
  search: "/app/jobs",
};

/** Change since the previous diagnostic, per dimension. */
export function evolution(
  current: { key: Dimension; score: number }[],
  previous: { key: Dimension; score: number }[],
) {
  return current.map((item) => {
    const before = previous.find((other) => other.key === item.key);
    return { key: item.key, delta: before ? item.score - before.score : null };
  });
}
