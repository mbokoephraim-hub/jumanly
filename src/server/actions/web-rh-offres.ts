"use server";

import { z } from "zod";
import { featuredStudyFields } from "@/lib/studies";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError } from "@/server/services/hire";
import { requestedDocumentKinds, saveJobStep } from "@/server/services/hire-offers";
import { assignJob } from "@/server/services/org-structure";
import { screeningQuestionsOf } from "@/server/services/screening";
import type { RhOfferResult } from "./phone-rh-offres";

/**
 * « Publier une offre » of the recruiter on a computer (Modèle B, lot N2, captures 038 to 042):
 * the five steps save the whole draft through the same service as the phone (`saveJobStep`), so
 * the rules stay the same (organization, wording checked, skills from the referential). What the
 * steps do not show (missions, benefits, instructions…) is kept as it was. Order of CLAUDE.md:
 * validate → session → role → service.
 */
const OFFERS = "/app/hire/offres";

const skill = z.string().trim().min(1).max(80);
const draftInput = z.object({
  jobId: z.string().trim().max(60).optional(),
  title: z.string().trim().max(120),
  domain: z.union([z.literal(""), z.enum(featuredStudyFields)]),
  openings: z.number().int().min(1).max(50),
  description: z.string().trim().max(8000),
  required: z.array(skill).max(20),
  preferred: z.array(skill).max(20),
  city: z.string().trim().max(120),
  country: z.string().trim().max(80),
  remote: z.enum(["onsite", "hybrid", "remote"]),
  contract: z.enum(["cdi", "cdd", "stage", "mission", "freelance", "alternance", "volontariat"]),
  salaryShown: z.boolean(),
  salaryMin: z.string().trim().max(9),
  salaryMax: z.string().trim().max(9),
  closesAt: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  questions: z.array(z.string().trim().min(5).max(200)).max(5),
  documents: z.array(z.enum(requestedDocumentKinds)).max(4),
});

export type WebOfferDraftInput = z.input<typeof draftInput>;

/** Each « Continuer »: the draft is created at the first one, then kept up to date. */
export async function webSaveOfferAction(raw: WebOfferDraftInput): Promise<RhOfferResult> {
  const parsed = draftInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
  try {
    const job = input.jobId ? await getOrgJob(db, ctx, input.jobId) : null;
    const poste = await saveJobStep(
      db,
      ctx,
      "poste",
      {
        title: input.title,
        domain: input.domain,
        experienceMin: String(job?.experienceMin ?? 0),
        city: input.city,
        country: input.country,
        remote: input.remote,
        contractType: input.contract,
        openings: String(input.openings),
        salaryMin: input.salaryShown ? input.salaryMin : "",
        salaryMax: input.salaryShown ? input.salaryMax : "",
      },
      job?.id,
    );
    if (!poste.ok) return poste;
    const description = await saveJobStep(
      db,
      ctx,
      "description",
      {
        description: input.description,
        responsibilities: (job?.responsibilities ?? []).join("\n"),
        requirements: (job?.requirements ?? []).join("\n"),
        benefits: (job?.benefits ?? []).join("\n"),
        requiredSkills: input.required.join("\n"),
        preferredSkills: input.preferred
          .filter((name) => !input.required.includes(name))
          .join("\n"),
      },
      poste.jobId,
    );
    if (!description.ok) return description;
    const before = screeningQuestionsOf(job?.screeningQuestions);
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
        closesAt: input.closesAt,
        documents: input.documents,
        questions: JSON.stringify(questions),
        instructions: job?.applicationInstructions ?? "",
        knockout: (Array.isArray(job?.knockoutCriteria) ? job.knockoutCriteria : [])
          .filter((item): item is string => typeof item === "string")
          .join("\n"),
      },
      poste.jobId,
    );
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}

const teamInput = z.object({
  jobId: z.string().trim().min(1).max(60),
  ownerId: z.string().trim().max(60),
  evaluatorIds: z.array(z.string().trim().min(1).max(60)).max(30),
});

/**
 * Step 5, « Aperçu et équipe »: who is in charge and which managers evaluate. Each part follows
 * its entitlement (`org.teams`, `hire.collaboration`) inside `assignJob`; the team and the
 * department of the offer are kept.
 */
export async function webAssignOfferAction(
  raw: z.input<typeof teamInput>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = teamInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
  try {
    const job = await getOrgJob(db, ctx, input.jobId);
    await assignJob(db, ctx, job.id, {
      assignedToId: input.ownerId,
      teamId: job.teamId ?? "",
      departmentId: job.departmentId ?? "",
      entityId: job.entityId ?? "",
      memberIds: input.evaluatorIds,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}
