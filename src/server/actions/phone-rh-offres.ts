"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError, publishJob } from "@/server/services/hire";
import { requestedDocumentKinds, saveJobStep } from "@/server/services/hire-offers";
import { screeningQuestionsOf } from "@/server/services/screening";

/**
 * « Nouvelle offre » on the recruiter's phone (Modèle B recruteur, M4, planches Recruteur-publier-1
 * to -5): the four steps save through the same service as the computer (`saveJobStep`), so the
 * rules stay the same (organization, wording checked, skills from the referential). What the phone
 * does not show (missions, deadline, instructions…) is kept as it was. Order of CLAUDE.md:
 * validate → session → role → service.
 */
const OFFERS = "/app/hire/offres";

export type RhOfferResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string; field?: string; unknownSkills?: string[] };

const posteInput = z.object({
  jobId: z.string().trim().max(60).optional(),
  title: z.string().trim().max(120),
  description: z.string().trim().max(8000),
  skills: z.array(z.string().trim().min(1).max(80)).max(20),
  city: z.string().trim().max(120),
  country: z.string().trim().max(80),
  remote: z.enum(["onsite", "hybrid", "remote"]),
  contract: z.enum(["cdi", "cdd", "stage", "mission", "freelance", "alternance", "volontariat"]),
  salaryShown: z.boolean(),
  salaryMin: z.string().trim().max(9),
  salaryMax: z.string().trim().max(9),
});

/** Steps 1 and 2: the post, its text and skills, then where and how. Creates the draft. */
export async function rhSaveOfferAction(raw: z.input<typeof posteInput>): Promise<RhOfferResult> {
  const parsed = posteInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const { ctx } = await requireHire(OFFERS, "manage");
  try {
    const job = input.jobId ? await getOrgJob(db, ctx, input.jobId) : null;
    const poste = await saveJobStep(
      db,
      ctx,
      "poste",
      {
        title: input.title,
        domain: job?.domain ?? "",
        experienceMin: String(job?.experienceMin ?? 0),
        city: input.city,
        country: input.country,
        remote: input.remote,
        contractType: input.contract,
        openings: String(job?.openings ?? 1),
        salaryMin: input.salaryShown ? input.salaryMin : "",
        salaryMax: input.salaryShown ? input.salaryMax : "",
      },
      job?.id,
    );
    if (!poste.ok) return poste;
    const kept = (importance: string) =>
      job?.skills.filter((item) => item.importance === importance).map((item) => item.skill.name);
    const description = await saveJobStep(
      db,
      ctx,
      "description",
      {
        description: input.description,
        responsibilities: (job?.responsibilities ?? []).join("\n"),
        requirements: (job?.requirements ?? []).join("\n"),
        benefits: (job?.benefits ?? []).join("\n"),
        requiredSkills: input.skills.join("\n"),
        preferredSkills: (kept("preferred") ?? [])
          .filter((name) => !input.skills.includes(name))
          .join("\n"),
      },
      poste.jobId,
    );
    return description.ok ? { ok: true, jobId: poste.jobId } : description;
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}

const candidatureInput = z.object({
  jobId: z.string().trim().min(1).max(60),
  questions: z.array(z.string().trim().min(5).max(200)).max(5),
  documents: z.array(z.enum(requestedDocumentKinds)).max(4),
});

/** Step 3, « La présélection »: questions (never a condition to apply) and documents asked. */
export async function rhSaveScreeningAction(
  raw: z.input<typeof candidatureInput>,
): Promise<RhOfferResult> {
  const parsed = candidatureInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const { ctx } = await requireHire(OFFERS, "manage");
  try {
    const job = await getOrgJob(db, ctx, input.jobId);
    const before = screeningQuestionsOf(job.screeningQuestions);
    const questions = input.questions.map(
      (text, index) =>
        before.find((question) => question.text === text) ?? {
          id: `q${Date.now().toString(36)}${index}`,
          text,
          kind: "text" as const,
        },
    );
    return await saveJobStep(
      db,
      ctx,
      "candidature",
      {
        closesAt: job.closesAt ? job.closesAt.toISOString().slice(0, 10) : "",
        documents: input.documents,
        questions: JSON.stringify(questions),
        instructions: job.applicationInstructions ?? "",
        knockout: (Array.isArray(job.knockoutCriteria) ? job.knockoutCriteria : [])
          .filter((item): item is string => typeof item === "string")
          .join("\n"),
      },
      job.id,
    );
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}

/** Step 4, « Publier l'offre »: within `jobs.active.max`; an unverified company goes to review. */
export async function rhPublishOfferAction(
  jobId: string,
): Promise<{ ok: true; review: boolean } | { ok: false; error: string }> {
  const id = z.string().trim().min(1).max(60).safeParse(jobId);
  if (!id.success) return { ok: false, error: "invalid" };
  const { ctx } = await requireHire(OFFERS, "manage");
  try {
    const result = await publishJob(db, ctx, id.data);
    if (result.status === "limit") return { ok: false, error: "limit" };
    if (result.status === "incomplete") return { ok: false, error: result.missing };
    const job = await db.job.findUniqueOrThrow({ where: { id: id.data }, select: { slug: true } });
    updateTag("jobs");
    updateTag(`job:${job.slug}`);
    return { ok: true, review: result.status !== "published" };
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}
