/**
 * Help to write a job (mockup 04-03): a first version from the essentials, or clearer missions.
 * The recruiter applies or ignores each proposal; nothing is saved by the AI itself. The model
 * never adds a criterion on protected data (CLAUDE.md § 4): proposals that mention one are dropped.
 * Credits come from the organization (`ai.credits.monthly`), the consent from the member.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { aiFeatures, AiError, AI_CREDITS_KEY, runAi } from "@/server/ai";
import { usage } from "@/server/entitlements";
import { isProtectedCriterion, type HireContext } from "./hire";

const line = z.string().trim().min(3).max(300);

export const jobWriterInput = z.object({
  mode: z.enum(["draft", "improve"]),
  title: z.string().trim().min(3).max(120),
  contract: z.string().trim().max(60).default(""),
  workMode: z.string().trim().max(60).default(""),
  city: z.string().trim().max(120).default(""),
  country: z.string().trim().max(80).default(""),
  description: z.string().trim().max(8000).default(""),
  responsibilities: z.array(z.string().trim().max(300)).max(20).default([]),
  requirements: z.array(z.string().trim().max(300)).max(20).default([]),
});
export type JobWriterInput = z.input<typeof jobWriterInput>;

const draftSchema = z.object({
  description: z.string().trim().max(1500),
  responsibilities: z.array(line).max(8),
  requirements: z.array(line).max(6),
  benefits: z.array(z.string().trim().min(2).max(80)).max(6),
});
const improveSchema = z.object({
  suggestions: z
    .array(z.object({ before: line, after: line, why: z.string().trim().min(3).max(300) }))
    .max(5),
});

export type JobDraft = z.infer<typeof draftSchema>;
export type JobSuggestion = z.infer<typeof improveSchema>["suggestions"][number];
export type JobWriterResult =
  | { ok: true; mode: "draft"; draft: JobDraft; source: "ai" | "template" }
  | { ok: true; mode: "improve"; suggestions: JobSuggestion[]; source: "ai" | "template" }
  | { ok: false; error: AiError["code"] | "invalid" };

const SYSTEM = `Tu aides une équipe de recrutement africaine à rédiger une offre d'emploi claire, en français.
Règles : phrases courtes et concrètes ; chaque mission commence par un verbe à l'infinitif ;
tu n'inventes ni salaire, ni avantage chiffré, ni nom d'outil absent des informations fournies ;
tu ne mentionnes jamais l'âge, le genre, l'origine, la religion, la situation familiale, la santé,
le handicap, la photo ou la nationalité ; aucun paiement ne peut être demandé aux candidats.`;

/** Whether the organization can use the help right now, without spending anything. */
export async function jobWriterReadiness(
  db: PrismaClient,
  ctx: HireContext,
): Promise<"ready" | "consent" | "locked" | "quota"> {
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { aiConsentAt: true },
  });
  if (!user?.aiConsentAt) return "consent";
  const credits = await usage(db, { type: "organization", id: ctx.organizationId }, AI_CREDITS_KEY);
  if (credits.limit === 0) return "locked";
  if (credits.limit > 0 && credits.used + aiFeatures.job_writer.credits > credits.limit)
    return "quota";
  return "ready";
}

const clean = (items: string[]) => items.filter((item) => !isProtectedCriterion(item));

export async function writeJob(
  db: PrismaClient,
  ctx: HireContext,
  raw: JobWriterInput,
): Promise<JobWriterResult> {
  const parsed = jobWriterInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const facts = [
    `Intitulé : ${input.title}`,
    input.contract && `Contrat : ${input.contract}`,
    input.workMode && `Mode de travail : ${input.workMode}`,
    (input.city || input.country) &&
      `Lieu : ${[input.city, input.country].filter(Boolean).join(", ")}`,
    input.description && `Présentation actuelle : ${input.description}`,
    input.responsibilities.length &&
      `Missions actuelles :\n- ${input.responsibilities.join("\n- ")}`,
    input.requirements.length && `Profil actuel :\n- ${input.requirements.join("\n- ")}`,
  ]
    .filter(Boolean)
    .join("\n");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  try {
    if (input.mode === "draft") {
      const run = await runAi(db, {
        userId: ctx.userId,
        subject,
        feature: "job_writer",
        system: SYSTEM,
        prompt: `${facts}\n\nPropose une première version de l'offre : une présentation du poste (3 à 5 phrases), 4 à 6 missions, 2 à 4 éléments de profil recherché et jusqu'à 3 avantages courants et neutres (ou aucun si rien ne permet de les déduire).`,
        schema: draftSchema,
        // Without a model, nothing is invented: the recruiter keeps what they wrote.
        template: () => ({
          description: input.description,
          responsibilities: input.responsibilities,
          requirements: input.requirements,
          benefits: [],
        }),
        maxTokens: 1200,
        timeoutMs: 25_000,
      });
      const draft = run.output;
      return {
        ok: true,
        mode: "draft",
        source: run.source,
        draft: {
          description: isProtectedCriterion(draft.description) ? "" : draft.description,
          responsibilities: clean(draft.responsibilities),
          requirements: clean(draft.requirements),
          benefits: clean(draft.benefits),
        },
      };
    }
    if (input.responsibilities.length === 0) return { ok: false, error: "invalid" };
    const run = await runAi(db, {
      userId: ctx.userId,
      subject,
      feature: "job_writer",
      system: SYSTEM,
      prompt: `${facts}\n\nPour au plus 3 missions peu claires (vagues, sans verbe, trop longues), propose une reformulation plus précise qui garde le sens. Reprends le texte d'origine mot pour mot dans « before ». Explique en une phrase pourquoi la nouvelle version aide les talents.`,
      schema: improveSchema,
      template: () => ({ suggestions: [] }),
      maxTokens: 900,
      timeoutMs: 25_000,
    });
    const suggestions = run.output.suggestions.filter(
      (item) =>
        input.responsibilities.includes(item.before) &&
        item.before !== item.after &&
        !isProtectedCriterion(item.after),
    );
    return { ok: true, mode: "improve", source: run.source, suggestions };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: error.code };
    throw error;
  }
}
