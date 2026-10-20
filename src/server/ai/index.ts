/**
 * Every call to the model goes through `runAi` (partie 08 § 8.9, CLAUDE.md § 12), in this order:
 * consent of the person → entitlement → quota `ai.credits.monthly` → model → Zod validation →
 * log in AiUsage. A rejected output falls back to the deterministic template and costs no credit;
 * an unavailable model costs no credit either (« Aucun crédit n'a été utilisé »).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import {
  can,
  consume,
  level,
  QuotaExceededError,
  release,
  resolvePlan,
  usage,
  type Subject,
} from "@/server/entitlements";
import { aiProvider, AiUnavailableError, type AiProvider, type GenerateInput } from "./provider";
import { costMicroUsd } from "./prices";
import { reportError } from "@/server/observability";

export const aiFeatures = {
  cv_parse: { credits: 1, tier: "fast" },
  cv_coach: { credits: 2, tier: "default" },
  diagnostic: { credits: 2, tier: "default" },
  // The two follow-up questions of the personalized diagnostic (docs/experience-animee § 5.3).
  diagnostic_followup: { credits: 1, tier: "fast" },
  // E10. Interview simulations are paid by their own quota (`career.interview.*.monthly`, one
  // per session), so their model calls cost no credit.
  interview_questions: { credits: 0, tier: "fast" },
  interview_feedback: { credits: 0, tier: "default" },
  career_document: { credits: 2, tier: "default" },
  proofread: { credits: 1, tier: "fast" },
  linkedin: { credits: 2, tier: "default" },
  cv_tailor: { credits: 2, tier: "default" },
  // Lot 11 · help to write a job (mockup 04-03), paid by the organization's credits.
  job_writer: { credits: 1, tier: "fast" },
  // ux-test, étape 2 · the AI Learning Coach, grounded in the lessons of one course.
  learn_coach: { credits: 1, tier: "fast" },
  // Talent lot 4 § 9 · the free conversation with Orbi, one credit per answer.
  orbi_chat: { credits: 1, tier: "fast" },
  // Recruiter lot 3 · Orbi's analysis of an application (`hire.cv_analysis`), paid by the
  // organization's credits.
  cv_analysis: { credits: 1, tier: "default" },
  // Recruiter lot 5 · Orbi in the recruiter space and its drafts in a conversation, paid by the
  // organization's credits. Nothing is sent: the recruiter reads and decides.
  recruiter_orbi: { credits: 1, tier: "fast" },
  message_draft: { credits: 1, tier: "fast" },
} as const;
export type AiFeature = keyof typeof aiFeatures;

export const AI_CREDITS_KEY = "ai.credits.monthly";

export class AiError extends Error {
  constructor(
    readonly code: "consent" | "entitlement" | "quota" | "unavailable",
    readonly resetsAt?: Date,
  ) {
    super(`AI ${code}`);
  }
}

/** A feature gate: a boolean entitlement, or a level among those allowed. */
export type AiGate = { key: string; levels?: string[] };

export type AiRun<T> = {
  output: T;
  /** "ai" when the model answered, "template" when its output was rejected. */
  source: "ai" | "template";
};

async function allowed(db: PrismaClient, subject: Subject, gate?: AiGate) {
  if (!gate) return true;
  if (gate.levels) return gate.levels.includes(await level(db, subject, gate.key));
  return can(db, subject, gate.key);
}

/**
 * What stops a person from using an AI feature right now, without spending anything: used by
 * pages to show the right lock (consent, plan or credits).
 */
export async function aiReadiness(
  db: PrismaClient,
  userId: string,
  feature: AiFeature,
  gate?: AiGate,
): Promise<"ready" | AiError["code"]> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { aiConsentAt: true } });
  if (!user?.aiConsentAt) return "consent";
  const subject: Subject = { type: "user", id: userId };
  if (!(await allowed(db, subject, gate))) return "entitlement";
  const credits: number = aiFeatures[feature].credits;
  if (credits === 0) return "ready";
  const current = await usage(db, subject, AI_CREDITS_KEY);
  if (current.limit >= 0 && current.used + credits > current.limit) return "quota";
  return "ready";
}

function withTimeout<V>(promise: Promise<V>, ms: number): Promise<V> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AiUnavailableError(new Error(`timeout ${ms} ms`))), ms);
  });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}

export async function runAi<T>(
  db: PrismaClient,
  input: {
    userId: string;
    feature: AiFeature;
    gate?: AiGate;
    system: string;
    prompt: string;
    schema: GenerateInput<T>["schema"];
    template: () => T;
    maxTokens?: number;
    /** Beyond this delay the call counts as unavailable: credits released, nothing kept. */
    timeoutMs?: number;
    /** Who pays the credits and holds the gate: the person by default, or their organization. */
    subject?: Subject;
  },
  options: { provider?: AiProvider; now?: Date } = {},
): Promise<AiRun<T>> {
  const now = options.now ?? new Date();
  const config = aiFeatures[input.feature];
  const subject: Subject = input.subject ?? { type: "user", id: input.userId };

  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { aiConsentAt: true },
  });
  if (!user?.aiConsentAt) throw new AiError("consent");
  if (!(await allowed(db, subject, input.gate))) throw new AiError("entitlement");
  const credits: number = config.credits;
  try {
    if (credits > 0) await consume(db, subject, AI_CREDITS_KEY, credits, now);
  } catch (error) {
    if (error instanceof QuotaExceededError) throw new AiError("quota", error.resetsAt);
    throw error;
  }

  const provider = options.provider ?? aiProvider();
  const plan = await resolvePlan(db, subject, now);
  const log = (status: string, model: string, inputTokens = 0, outputTokens = 0) =>
    db.aiUsage.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        model,
        inputTokens,
        outputTokens,
        costMicroUsd: costMicroUsd(model, inputTokens, outputTokens),
        planCode: plan?.planCode ?? null,
        status,
        createdAt: now,
      },
    });

  let result;
  try {
    const generation = provider.generate({
      tier: config.tier,
      system: input.system,
      prompt: input.prompt,
      schema: input.schema,
      template: input.template,
      maxTokens: input.maxTokens,
    });
    result = input.timeoutMs ? await withTimeout(generation, input.timeoutMs) : await generation;
  } catch (error) {
    if (credits > 0) await release(db, subject, AI_CREDITS_KEY, credits, now);
    await log("error", provider.name);
    if (error instanceof AiUnavailableError) {
      void reportError(error.cause ?? error, { message: "IA indisponible" });
      throw new AiError("unavailable");
    }
    throw error;
  }
  if (result.output === null) {
    if (credits > 0) await release(db, subject, AI_CREDITS_KEY, credits, now);
    await log("invalid", result.model, result.inputTokens, result.outputTokens);
    return { output: input.template(), source: "template" };
  }
  await log("ok", result.model, result.inputTokens, result.outputTokens);
  return { output: result.output, source: "ai" };
}
