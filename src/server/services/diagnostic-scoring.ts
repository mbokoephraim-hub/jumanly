/**
 * Career diagnostic, scoring `diagnostic_scoring_v2` (partie 08 § 8.11,
 * docs/experience-animee § 5.3): six dimensions scored out of 100 by fixed rules, a global level
 * on four stages, and the adaptive questions. Pure functions, shared by the server (which always
 * recomputes) and the questionnaire (live radar). The AI never scores (règle d'or 3).
 */
import { z } from "zod";

export const SCORING_VERSION = "diagnostic_scoring_v2";

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
/** Skills assessed one by one (the most asked for in the offers of the target job). */
export const SKILLS_ASSESSED = 5;

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
  // 1. Clarté du projet
  situation: pick(choiceAnswers.situation),
  goal: pick(choiceAnswers.goal),
  targetRole: text(120),
  sectors: text(200),
  familiarity: optionalPick(choiceAnswers.familiarity),
  companies: optionalPick(choiceAnswers.companies),
  // 2. Compétences
  topSkills: text(200),
  skillsToBuild: text(200),
  skillChecks: z.array(skillCheckSchema).max(SKILLS_ASSESSED).default([]),
  languages: text(200),
  digital: text(200),
  // 3. Expérience
  experience: pick(choiceAnswers.experience),
  education: z.enum(educationAnswers),
  quantified: optionalPick(choiceAnswers.quantified),
  achievement: text(1000),
  // 4. Outils de candidature
  cvStatus: pick(choiceAnswers.cvStatus),
  coverLetter: pick(choiceAnswers.coverLetter),
  onlineProfile: pick(choiceAnswers.onlineProfile),
  // 5. Entretiens
  confidence: z.coerce.number().int().min(1).max(5),
  interviews: pick(choiceAnswers.interviews),
  pitch: pick(choiceAnswers.pitch),
  // 6. Recherche active et réseau
  applications: pick(choiceAnswers.applications),
  obstacle: pick(choiceAnswers.obstacle),
  time: pick(choiceAnswers.time),
  mobility: pick(choiceAnswers.mobility),
  workMode: pick(choiceAnswers.workMode),
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
  | { id: `skill${number}`; dimension: "skills"; skill: string; index: number }
  | { id: `followUp${number}`; dimension: "more"; followUp: string; index: number };

const base: { id: QuestionId; dimension: Dimension }[] = [
  { id: "situation", dimension: "clarity" },
  { id: "goal", dimension: "clarity" },
  { id: "targetRole", dimension: "clarity" },
  { id: "familiarity", dimension: "clarity" },
  { id: "companies", dimension: "clarity" },
  { id: "sectors", dimension: "clarity" },
  { id: "topSkills", dimension: "skills" },
  { id: "skillsToBuild", dimension: "skills" },
  { id: "languages", dimension: "skills" },
  { id: "digital", dimension: "skills" },
  { id: "experience", dimension: "experience" },
  { id: "education", dimension: "experience" },
  { id: "quantified", dimension: "experience" },
  { id: "achievement", dimension: "experience" },
  { id: "cvStatus", dimension: "tools" },
  { id: "coverLetter", dimension: "tools" },
  { id: "onlineProfile", dimension: "tools" },
  { id: "confidence", dimension: "interviews" },
  { id: "interviews", dimension: "interviews" },
  { id: "pitch", dimension: "interviews" },
  { id: "applications", dimension: "search" },
  { id: "obstacle", dimension: "search" },
  { id: "time", dimension: "search" },
  { id: "mobility", dimension: "search" },
  { id: "workMode", dimension: "search" },
  { id: "contacts", dimension: "search" },
];

/** Free-text questions: they can be left empty. */
export const optionalQuestions: readonly string[] = [
  "targetRole",
  "sectors",
  "topSkills",
  "skillsToBuild",
  "languages",
  "digital",
  "achievement",
  "feedback",
  "horizon",
];

/**
 * The screens to show for the answers so far: no question on the target job without one, no
 * question on figures in a job without experience, one screen per assessed skill. The
 * personalized level adds four questions at the end, then the follow-ups once they are asked.
 */
export function screensFor(draft: Draft, skills: string[], personalized: boolean): Screen[] {
  const hasRole = Boolean(draft.targetRole?.trim());
  const worked = draft.experience !== undefined && draft.experience !== "a1";
  const screens: Screen[] = [];
  for (const item of base) {
    if ((item.id === "familiarity" || item.id === "companies") && !hasRole) continue;
    if (item.id === "quantified" && !worked) continue;
    screens.push(item);
    if (item.id === "skillsToBuild") {
      skills
        .slice(0, SKILLS_ASSESSED)
        .forEach((skill, index) =>
          screens.push({ id: `skill${index}`, dimension: "skills", skill, index }),
        );
    }
  }
  if (personalized) {
    for (const id of ["values", "workStyle", "feedback", "horizon"] as const)
      screens.push({ id, dimension: "more" });
    (draft.followUps ?? [])
      .slice(0, FOLLOW_UPS)
      .forEach((item, index) =>
        screens.push({ id: `followUp${index}`, dimension: "more", followUp: item.question, index }),
      );
  }
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
  if (draft.pitch === "a2" || draft.pitch === "a3") codes.push({ code: "pitch" });
  codes.push({ code: "nextJob" }, { code: "proudSkill" });
  return codes.slice(0, FOLLOW_UPS);
}

// ─── Barème ──────────────────────────────────────────────────────────────────

export type Reason = { code: string; points: number; max: number };
export type DimensionScore = { key: Dimension; score: number; reasons: Reason[] };

const listCount = (value: string | undefined) =>
  (value ?? "")
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean).length;

const table = (values: Record<string, number>, answer: string | undefined) =>
  answer ? (values[answer] ?? 0) : 0;

/** Fixed points of each answer (partie 08 § 8.11). */
export const POINTS = {
  clarity: {
    targetRole: 35,
    familiarity: { a1: 25, a2: 18, a3: 8, a4: 0 },
    companies: { a1: 20, a2: 10, a3: 0 },
    sectors: 10,
    obstacle: 10,
  },
  skills: {
    level: 40,
    proof: 30,
    proofValue: { a1: 1, a2: 0.8, a3: 0.8, a4: 0 } as Record<string, number>,
    topSkills: { many: 15, some: 8 },
    languages: { many: 8, one: 4 },
    digital: 7,
  },
  experience: {
    experience: { a1: 0, a2: 15, a3: 30, a4: 40, a5: 50 },
    education: { none: 0, secondary: 8, vocational: 15, bachelor: 20, master: 25, doctorate: 25 },
    quantified: { a1: 15, a2: 8, a3: 0 },
    achievement: 10,
  },
  tools: {
    cvStatus: { a1: 0, a2: 20, a3: 45 },
    coverLetter: { a1: 30, a2: 15, a3: 0 },
    onlineProfile: { a1: 25, a2: 10, a3: 0 },
  },
  interviews: {
    confidence: 40,
    interviews: { a1: 0, a2: 15, a3: 25, a4: 30 },
    pitch: { a1: 30, a2: 15, a3: 0 },
  },
  search: {
    applications: { a1: 0, a2: 15, a3: 28, a4: 35 },
    time: { a1: 5, a2: 12, a3: 20, a4: 25 },
    contacts: { a1: 0, a2: 15, a3: 30, a4: 40 },
  },
} as const;

const maxOf = (values: Record<string, number>) => Math.max(...Object.values(values));

function reason(code: string, points: number, max: number): Reason {
  return { code, points: Math.round(points), max };
}

/** The six dimensions for the answers so far: a question not answered yet counts 0. */
export function scoreDimensions(draft: Draft): DimensionScore[] {
  const p = POINTS;
  const hasRole = Boolean(draft.targetRole?.trim());
  const worked = draft.experience !== undefined && draft.experience !== "a1";
  const checks = draft.skillChecks ?? [];
  const named = listCount(draft.topSkills);
  const languages = listCount(draft.languages);
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
        "companies",
        hasRole ? table(p.clarity.companies, draft.companies) : 0,
        maxOf(p.clarity.companies),
      ),
      reason("sectors", listCount(draft.sectors) > 0 ? p.clarity.sectors : 0, p.clarity.sectors),
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
      reason(
        "topSkills",
        named >= 3 ? p.skills.topSkills.many : named > 0 ? p.skills.topSkills.some : 0,
        p.skills.topSkills.many,
      ),
      reason(
        "languages",
        languages >= 2 ? p.skills.languages.many : languages === 1 ? p.skills.languages.one : 0,
        p.skills.languages.many,
      ),
      reason("digital", listCount(draft.digital) > 0 ? p.skills.digital : 0, p.skills.digital),
    ],
    experience: [
      reason(
        "experience",
        table(p.experience.experience, draft.experience),
        maxOf(p.experience.experience),
      ),
      reason(
        "education",
        table(p.experience.education, draft.education),
        maxOf(p.experience.education),
      ),
      reason(
        "quantified",
        worked ? table(p.experience.quantified, draft.quantified) : 0,
        maxOf(p.experience.quantified),
      ),
      reason(
        "achievement",
        (draft.achievement ?? "").trim().length >= 30 ? p.experience.achievement : 0,
        p.experience.achievement,
      ),
    ],
    tools: [
      reason("cvStatus", table(p.tools.cvStatus, draft.cvStatus), maxOf(p.tools.cvStatus)),
      reason(
        "coverLetter",
        table(p.tools.coverLetter, draft.coverLetter),
        maxOf(p.tools.coverLetter),
      ),
      reason(
        "onlineProfile",
        table(p.tools.onlineProfile, draft.onlineProfile),
        maxOf(p.tools.onlineProfile),
      ),
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
      reason("pitch", table(p.interviews.pitch, draft.pitch), maxOf(p.interviews.pitch)),
    ],
    search: [
      reason(
        "applications",
        table(p.search.applications, draft.applications),
        maxOf(p.search.applications),
      ),
      reason("time", table(p.search.time, draft.time), maxOf(p.search.time)),
      reason("contacts", table(p.search.contacts, draft.contacts), maxOf(p.search.contacts)),
    ],
  };
  return dimensions.map((key) => ({
    key,
    score: Math.min(
      100,
      groups[key].reduce((sum, item) => sum + item.points, 0),
    ),
    reasons: groups[key],
  }));
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
