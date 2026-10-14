/**
 * Simplified career diagnostic (partie 07 § 3, E3): 12 questions and fixed rules, no AI.
 * The personalized version (AI) arrives with Intelligence (E6) behind `career.diagnostic.level`.
 */
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

/** Question → answer codes (texts `career.diagnostic.q.<id>.a<n>`). */
const choice = (count: number) => Array.from({ length: count }, (_, index) => `a${index + 1}`);

export const diagnosticParts = [
  { id: "situation", questions: ["situation", "experience", "education"] },
  { id: "goals", questions: ["goal", "targetRole"] },
  { id: "skills", questions: ["topSkills", "confidence"] },
  { id: "search", questions: ["cvStatus", "applications", "obstacle", "time", "mobility"] },
] as const;

export const educationAnswers = [
  "none",
  "secondary",
  "vocational",
  "bachelor",
  "master",
  "doctorate",
] as const;

export const choiceQuestions = {
  situation: choice(6),
  experience: choice(5),
  goal: choice(6),
  cvStatus: choice(3),
  applications: choice(4),
  obstacle: choice(6),
  time: choice(4),
  mobility: choice(4),
} as const;

export const DIAGNOSTIC_QUESTIONS = 12;

const pick = (values: readonly string[]) => z.enum(values as [string, ...string[]]);

export const simpleAnswersSchema = z.object({
  situation: pick(choiceQuestions.situation),
  experience: pick(choiceQuestions.experience),
  education: z.enum(educationAnswers),
  goal: pick(choiceQuestions.goal),
  targetRole: z.string().trim().max(120).default(""),
  topSkills: z.string().trim().max(200).default(""),
  confidence: z.coerce.number().int().min(1).max(5),
  cvStatus: pick(choiceQuestions.cvStatus),
  applications: pick(choiceQuestions.applications),
  obstacle: pick(choiceQuestions.obstacle),
  time: pick(choiceQuestions.time),
  mobility: pick(choiceQuestions.mobility),
});

export type SimpleAnswers = z.infer<typeof simpleAnswersSchema>;

export type Priority = "role" | "skills" | "cv" | "interview" | "search" | "network";
export type Strength =
  "experience" | "education" | "availability" | "mobility" | "interview" | "applications";
export type Step = "profile" | "cv" | "skills" | "interview" | "jobs" | "network" | "role";

export type DiagnosticResult = {
  readiness: "low" | "medium" | "high";
  /** Skills the person named as their strongest, then rule-based strengths. */
  skills: string[];
  strengths: Strength[];
  priorities: Priority[];
  roles: string[];
  steps: Step[];
};

const obstaclePriority: Record<string, Priority> = {
  a1: "role",
  a2: "skills",
  a3: "cv",
  a4: "interview",
  a5: "search",
  a6: "network",
};

const priorityStep: Record<Priority, Step> = {
  role: "role",
  skills: "skills",
  cv: "cv",
  interview: "interview",
  search: "jobs",
  network: "network",
};

/** The fixed rules of the simplified diagnostic. Same answers, same result. */
export function simpleDiagnostic(answers: SimpleAnswers): DiagnosticResult {
  const experienceYears = choiceQuestions.experience.indexOf(answers.experience as "a1");
  const higherEducation = ["bachelor", "master", "doctorate"].includes(answers.education);

  let score = 0;
  score += experienceYears >= 2 ? 2 : experienceYears === 1 ? 1 : 0;
  score += answers.cvStatus === "a3" ? 2 : answers.cvStatus === "a2" ? 1 : 0;
  score += answers.confidence >= 4 ? 2 : answers.confidence === 3 ? 1 : 0;
  score += answers.applications !== "a1" ? 1 : 0;
  score += higherEducation ? 1 : 0;
  const readiness = score <= 3 ? "low" : score <= 5 ? "medium" : "high";

  const strengths: Strength[] = [];
  if (experienceYears >= 2) strengths.push("experience");
  if (higherEducation) strengths.push("education");
  if (answers.time === "a3" || answers.time === "a4") strengths.push("availability");
  if (answers.mobility === "a3" || answers.mobility === "a4") strengths.push("mobility");
  if (answers.confidence >= 4) strengths.push("interview");
  if (answers.applications === "a3" || answers.applications === "a4")
    strengths.push("applications");

  const priorities: Priority[] = [];
  const add = (priority: Priority) => {
    if (!priorities.includes(priority) && priorities.length < 3) priorities.push(priority);
  };
  add(obstaclePriority[answers.obstacle] ?? "search");
  if (answers.cvStatus !== "a3") add("cv");
  if (answers.confidence <= 2) add("interview");
  if (!answers.targetRole) add("role");
  if (answers.applications === "a1") add("search");
  add("skills");

  const steps: Step[] = (
    ["profile", ...priorities.map((priority) => priorityStep[priority])] as Step[]
  )
    .filter((step, index, all) => all.indexOf(step) === index)
    .slice(0, 3);

  return {
    readiness,
    skills: answers.topSkills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3),
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

/** Where each next step leads. */
export const stepLinks: Record<Step, string> = {
  profile: "/app/profil",
  cv: "/app/career/cv",
  skills: "/formations",
  interview: "/app/career",
  jobs: "/app/jobs",
  network: "/app/profil",
  role: "/app/career/diagnostic",
};
