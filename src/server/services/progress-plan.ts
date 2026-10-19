/**
 * Progress plan (`/app/career/plan`, `career.progress_plan`): the diagnostic turned into steps
 * the talent ticks off. Built by rules from the last diagnostic and the skills missing in the
 * most compatible jobs (§ 8.7); no model call, no credit. The talent edits everything.
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { recommendedCourses } from "@/server/matching/service";
import { parseDiagnosticResult, stepLinks, steps as diagnosticSteps } from "./diagnostic";

export const PLAN_STEPS_MAX = 30;

const stepSchema = z.object({
  id: z.string(),
  /** diagnostic: `code` is a step of the diagnostic (text `career.diagnostic.rule.step.*`). */
  kind: z.enum(["diagnostic", "course", "custom"]),
  code: z.enum(diagnosticSteps).nullable(),
  title: z.string(),
  href: z.string().nullable(),
  /** "2026-11-30" */
  due: z.string().nullable(),
  done: z.boolean(),
});
export type PlanStep = z.infer<typeof stepSchema>;

export function parseSteps(value: Prisma.JsonValue): PlanStep[] {
  const parsed = z.array(stepSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

const json = (steps: PlanStep[]) => steps as unknown as Prisma.InputJsonValue;

export function stepState(step: PlanStep, now = new Date()) {
  if (step.done) return "done" as const;
  if (step.due && new Date(`${step.due}T23:59:59Z`) < now) return "late" as const;
  return "todo" as const;
}

export async function getPlan(db: PrismaClient, userId: string) {
  const plan = await db.progressPlan.findUnique({ where: { userId } });
  return plan ? { ...plan, steps: parseSteps(plan.steps) } : null;
}

/** From the last diagnostic: its next steps, then up to three courses that close a gap. */
export async function planFromDiagnostic(
  db: PrismaClient,
  userId: string,
  opens: (requiredLevel: string) => boolean,
) {
  const diagnostic = await db.careerDiagnostic.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const result = diagnostic ? parseDiagnosticResult(diagnostic.result) : null;
  const courses = await recommendedCourses(db, userId, { opens, take: 3 });
  const steps: PlanStep[] = [
    ...(result?.steps ?? ["profile", "cv", "jobs"]).map((code) => ({
      id: randomUUID(),
      kind: "diagnostic" as const,
      code,
      title: "",
      href: stepLinks[code],
      due: null,
      done: false,
    })),
    ...courses.map((course) => ({
      id: randomUUID(),
      kind: "course" as const,
      code: null,
      title: course.title,
      href: `/app/learn/${course.slug}`,
      due: null,
      done: false,
    })),
  ];
  const goal = result?.roles[0] ?? "";
  return db.progressPlan.upsert({
    where: { userId },
    create: { userId, goal, steps: json(steps) },
    update: { goal, steps: json(steps) },
  });
}

export const goalSchema = z.object({ goal: z.string().trim().max(160) });
export const stepInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  due: z.union([z.iso.date(), z.literal("")]).optional(),
});

export async function saveGoal(db: PrismaClient, userId: string, goal: string) {
  return db.progressPlan.upsert({
    where: { userId },
    create: { userId, goal },
    update: { goal },
  });
}

async function editSteps(
  db: PrismaClient,
  userId: string,
  change: (steps: PlanStep[]) => PlanStep[],
) {
  const plan = await getPlan(db, userId);
  const steps = change(plan?.steps ?? []).slice(0, PLAN_STEPS_MAX);
  return db.progressPlan.upsert({
    where: { userId },
    create: { userId, goal: "", steps: json(steps) },
    update: { steps: json(steps) },
  });
}

export function addStep(db: PrismaClient, userId: string, input: z.infer<typeof stepInputSchema>) {
  return editSteps(db, userId, (steps) => [
    ...steps,
    {
      id: randomUUID(),
      kind: "custom",
      code: null,
      title: input.title,
      href: null,
      due: input.due || null,
      done: false,
    },
  ]);
}

export function toggleStep(db: PrismaClient, userId: string, stepId: string) {
  return editSteps(db, userId, (steps) =>
    steps.map((step) => (step.id === stepId ? { ...step, done: !step.done } : step)),
  );
}

export function deleteStep(db: PrismaClient, userId: string, stepId: string) {
  return editSteps(db, userId, (steps) => steps.filter((step) => step.id !== stepId));
}

/** « Modifier l'étape » (planche talent-4 § 5): the talent rewrites its title or its date. */
export function updateStep(
  db: PrismaClient,
  userId: string,
  stepId: string,
  input: z.infer<typeof stepInputSchema>,
) {
  return editSteps(db, userId, (steps) =>
    steps.map((step) =>
      step.id === stepId ? { ...step, title: input.title, due: input.due || null } : step,
    ),
  );
}

/** The step in progress: the first one not done yet. */
export function currentStepId(steps: PlanStep[]) {
  return steps.find((step) => !step.done)?.id ?? null;
}
