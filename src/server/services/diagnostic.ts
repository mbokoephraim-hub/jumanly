/**
 * Career diagnostic (partie 07 § 3, docs/experience-animee § 5): six dimensions scored by fixed
 * rules (`diagnostic_scoring_v2`, see ./diagnostic-scoring), available to everyone without AI.
 * The personalized version (`career.diagnostic.level`) adds a summary by Jumanly Intelligence.
 * Results of the first version (three readiness levels) are still read for the history.
 */
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import {
  dimensions,
  globalScore,
  prioritiesFor,
  SCORING_VERSION,
  scoreDimensions,
  screensFor,
  stageFor,
  stages,
  type Answers,
  type DimensionScore,
  type Priority,
  type Stage,
} from "./diagnostic-scoring";

export type { Priority } from "./diagnostic-scoring";
export type Strength =
  "experience" | "education" | "availability" | "mobility" | "interview" | "tools" | "applications";
export type Step = "profile" | "cv" | "skills" | "interview" | "jobs" | "network" | "role";

/** Fields every diagnostic result carries (the progress plan and the Career page read them). */
export type DiagnosticResult = {
  readiness: "low" | "medium" | "high";
  /** Skills the person named as their strongest. */
  skills: string[];
  strengths: Strength[];
  priorities: Priority[];
  roles: string[];
  steps: Step[];
};

/** A result of the fixed rules v2: global score, stage and the six dimensions. */
export type DiagnosticV2 = DiagnosticResult & {
  version: typeof SCORING_VERSION;
  score: number;
  stage: Stage;
  dimensions: DimensionScore[];
  /** Published offers compared to choose the assessed skills (real count). */
  offers: number;
  /** Questions asked (adaptive). */
  questions: number;
};

const priorityStep: Record<Priority, Step> = {
  role: "role",
  skills: "skills",
  experience: "profile",
  cv: "cv",
  interview: "interview",
  search: "jobs",
  network: "network",
};

const readinessOf: Record<Stage, DiagnosticResult["readiness"]> = {
  discovery: "low",
  building: "medium",
  ready: "high",
  competitive: "high",
};

const split = (value: string) =>
  value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

/** The fixed rules. Same answers, same result. */
export function ruleDiagnostic(
  answers: Answers,
  context: { offers?: number; personalized?: boolean } = {},
): DiagnosticV2 {
  const scores = scoreDimensions(answers);
  const score = globalScore(scores);
  const stage = stageFor(score);
  const priorities = prioritiesFor(scores, answers);
  const years = ["a1", "a2", "a3", "a4", "a5"].indexOf(answers.experience);

  const strengths: Strength[] = [];
  if (years >= 2) strengths.push("experience");
  if (["bachelor", "master", "doctorate"].includes(answers.education ?? ""))
    strengths.push("education");
  if (answers.time === "a3" || answers.time === "a4") strengths.push("availability");
  if (answers.mobility === "a3" || answers.mobility === "a4") strengths.push("mobility");
  if (answers.confidence >= 4) strengths.push("interview");
  if (answers.ready.length >= 3) strengths.push("tools");
  if (answers.applications === "a3" || answers.applications === "a4")
    strengths.push("applications");

  const steps = (["profile", ...priorities.map((priority) => priorityStep[priority])] as Step[])
    .filter((step, index, all) => all.indexOf(step) === index)
    .slice(0, 3);

  return {
    version: SCORING_VERSION,
    score,
    stage,
    dimensions: scores,
    offers: context.offers ?? 0,
    questions: screensFor(
      answers,
      answers.skillChecks.map((item) => item.skill),
      context.personalized ?? false,
    ).length,
    readiness: readinessOf[stage],
    skills: split(answers.topSkills).slice(0, 3),
    strengths,
    priorities,
    roles: answers.targetRole ? [answers.targetRole] : [],
    steps,
  };
}

const resultSchema = z.object({
  readiness: z.enum(["low", "medium", "high"]),
  skills: z.array(z.string()),
  strengths: z.array(z.string()),
  priorities: z.array(z.string()),
  roles: z.array(z.string()),
  steps: z.array(z.string()),
});

export function parseDiagnosticResult(value: Prisma.JsonValue): DiagnosticResult | null {
  const parsed = resultSchema.safeParse(value);
  return parsed.success ? (parsed.data as DiagnosticResult) : null;
}

const v2Schema = z.object({
  version: z.literal(SCORING_VERSION),
  score: z.number(),
  stage: z.enum(stages),
  dimensions: z.array(
    z.object({
      key: z.enum(dimensions),
      score: z.number(),
      reasons: z.array(z.object({ code: z.string(), points: z.number(), max: z.number() })),
    }),
  ),
  offers: z.number(),
  questions: z.number(),
});

/** The v2 part of a result, or null for a result of the first version. */
export function parseDiagnosticV2(value: Prisma.JsonValue): DiagnosticV2 | null {
  const legacy = parseDiagnosticResult(value);
  const parsed = v2Schema.safeParse(value);
  return legacy && parsed.success ? { ...legacy, ...parsed.data } : null;
}

/** Where each next step leads. */
export const stepLinks: Record<Step, string> = {
  profile: "/app/profil",
  cv: "/app/career/cv",
  skills: "/formations",
  interview: "/app/career/entretiens",
  jobs: "/app/jobs",
  network: "/app/profil",
  role: "/app/career/diagnostic",
};

// ─── Free mini plan ──────────────────────────────────────────────────────────

/**
 * The free mini plan of every diagnostic: one action per priority that needs no subscription
 * (profile, CV, free courses, applying, network), with where to do it. Texts
 * `career.diagnostic.miniPlan.step.<priority>.*`; the personalized level rewrites the sentences.
 */
export const miniPlanLinks: Record<Priority, string | null> = {
  role: "/app/jobs",
  skills: "/app/learn",
  experience: "/app/profil",
  cv: "/app/career/cv",
  interview: null,
  search: "/app/jobs",
  network: "/app/profil",
};

/** What a talent without the entitlement could get by subscribing, in the order shown. */
export const upgradeOptions = [
  { code: "progressPlan", key: "career.progress_plan", icon: "objectif" },
  {
    code: "personalized",
    key: "career.diagnostic.level",
    levels: ["personalized"],
    icon: "intelligence",
  },
  { code: "interview", key: "career.interview.text.monthly", icon: "message" },
  { code: "documents", key: "career.documents", icon: "doc" },
  { code: "recommendations", key: "career.progress_plan.recommendations", icon: "competence" },
] as const;

// ─── Personalized diagnostic (E6, `career.diagnostic.level` = personalized) ──

export const priorities = [
  "role",
  "skills",
  "experience",
  "cv",
  "interview",
  "search",
  "network",
] as const;
export const steps = ["profile", "cv", "skills", "interview", "jobs", "network", "role"] as const;

/** What the model writes: free sentences for strengths and the summary, codes for the rest. */
export const personalizedOutputSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  priorities: z.array(z.enum(priorities)),
  roles: z.array(z.string()),
  steps: z.array(z.enum(steps)),
  /** One free action per priority, written for this talent (the mini plan). */
  miniPlan: z
    .array(z.object({ priority: z.enum(priorities), text: z.string() }))
    .optional()
    .default([]),
});
export type PersonalizedOutput = z.input<typeof personalizedOutputSchema>;

/** The personalized result keeps the rules' scores, plus the sentences of the model. */
export type PersonalizedResult<T extends DiagnosticResult = DiagnosticResult> = T & {
  summary: string;
  strengthTexts: string[];
  /** Sentences of the model for the free mini plan, by priority. */
  miniPlan?: { priority: Priority; text: string }[];
};

/** The model explains and proposes; the scores and the stage stay those of the rules. */
export function mergePersonalized<T extends DiagnosticResult>(
  base: T,
  output: PersonalizedOutput,
): PersonalizedResult<T> {
  const unique = <V>(values: V[]) =>
    values.filter((value, index) => values.indexOf(value) === index);
  const picked = unique(output.priorities).slice(0, 3);
  const chosen = picked.length > 0 ? picked : base.priorities;
  const steps = unique(output.steps).slice(0, 3);
  return {
    ...base,
    priorities: chosen,
    steps: steps.length > 0 ? steps : base.steps,
    roles: unique(
      [...base.roles, ...output.roles].map((role) => role.trim()).filter(Boolean),
    ).slice(0, 4),
    summary: output.summary.trim().slice(0, 1200),
    strengthTexts: output.strengths
      .map((text) => text.trim())
      .filter(Boolean)
      .slice(0, 4),
    miniPlan: (output.miniPlan ?? [])
      .map((item) => ({ priority: item.priority, text: item.text.trim().slice(0, 300) }))
      .filter(
        (item, index, all) =>
          item.text &&
          chosen.includes(item.priority) &&
          all.findIndex((other) => other.priority === item.priority) === index,
      ),
  };
}

export function parsePersonalized(value: Prisma.JsonValue): PersonalizedResult | null {
  const base = parseDiagnosticResult(value);
  const extra = z
    .object({
      summary: z.string(),
      strengthTexts: z.array(z.string()),
      miniPlan: z.array(z.object({ priority: z.enum(priorities), text: z.string() })).optional(),
    })
    .safeParse(value);
  return base && extra.success ? { ...base, ...extra.data } : null;
}
