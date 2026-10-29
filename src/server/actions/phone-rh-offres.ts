"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError, publishJob } from "@/server/services/hire";
import {
  attachJobSheet,
  JobSheetError,
  removeJobSheet,
  requestedDocumentKinds,
  saveJobStep,
} from "@/server/services/hire-offers";
import {
  analyzeOffer,
  postOfferToFeed,
  saveOfferWizard,
  type OfferWizardInput,
} from "@/server/services/job-wizard";
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
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
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
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
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
  toFil = false,
  onem = false,
): Promise<{ ok: true; review: boolean; posted: boolean } | { ok: false; error: string }> {
  const id = z.string().trim().min(1).max(60).safeParse(jobId);
  if (!id.success) return { ok: false, error: "invalid" };
  // « Détenez-vous l'autorisation de l'ONEM ? »: asked before every publication (RDC, 29/10/2026).
  if (!onem) return { ok: false, error: "onem" };
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
  try {
    await getOrgJob(db, ctx, id.data).then((job) =>
      db.job.update({ where: { id: job.id }, data: { onemConfirmedAt: new Date() } }),
    );
    // « Publier aussi dans le Fil » off: no post now, nor at the approval.
    if (!toFil)
      await getOrgJob(db, ctx, id.data).then((job) =>
        db.job.update({ where: { id: job.id }, data: { feedTitle: null } }),
      );
    const result = await publishJob(db, ctx, id.data);
    if (result.status === "limit") return { ok: false, error: "limit" };
    if (result.status === "incomplete") return { ok: false, error: result.missing };
    const job = await db.job.findUniqueOrThrow({ where: { id: id.data }, select: { slug: true } });
    const post = toFil ? await postOfferToFeed(db, id.data) : null;
    updateTag("jobs");
    updateTag(`job:${job.slug}`);
    return { ok: true, review: result.status !== "published", posted: Boolean(post) };
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}

// ─── Publication étape par étape (29/10/2026) ───────────────────────────────────────────────────

/** Every step saves the whole offer (the draft exists from the first « Continuer » with a place). */
export async function rhSaveOfferWizardAction(
  raw: OfferWizardInput,
): Promise<RhOfferResult & { slug?: string }> {
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
  try {
    const result = await saveOfferWizard(db, ctx, raw);
    if (result.ok) {
      const job = await db.job.findUniqueOrThrow({
        where: { id: result.jobId },
        select: { slug: true, status: true },
      });
      if (job.status === "published" || job.status === "paused") {
        updateTag("jobs");
        updateTag(`job:${job.slug}`);
      }
    }
    return result;
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}

/** « L'analyse d'Orbi »: what is complete, what would help, what Jumanly checks. Free. */
export async function rhAnalyzeOfferAction(raw: Parameters<typeof analyzeOffer>[0]) {
  await requireHire(OFFERS, "manage", "publish");
  const input = z
    .object({
      title: z.string().max(120),
      description: z.string().max(8000),
      hardSkills: z.array(z.string().max(80)).max(20),
      softSkills: z.array(z.string().max(80)).max(20),
      responsibilities: z.array(z.string().max(300)).max(20),
      requirements: z.array(z.string().max(300)).max(20),
      languages: z.array(z.unknown()).max(10),
      salaryShown: z.boolean(),
      companyAbout: z.string().max(1500),
      feedTitle: z.string().max(120),
    })
    .safeParse(raw);
  if (!input.success) return null;
  return analyzeOffer(input.data);
}

/** « Joindre mon propre PDF »: checked (type, size, no active content), then kept on the offer. */
export async function rhAttachSheetAction(
  formData: FormData,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const jobId = String(formData.get("jobId") ?? "").slice(0, 60);
  const file = formData.get("sheet");
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
  if (!jobId || !(file instanceof File) || file.size === 0) return { ok: false, error: "type" };
  try {
    await attachJobSheet(db, ctx, jobId, {
      name: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
  } catch (error) {
    if (error instanceof JobSheetError) return { ok: false, error: error.code };
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
  const job = await db.job.findUniqueOrThrow({
    where: { id: jobId },
    select: { jobSheetName: true, slug: true },
  });
  updateTag(`job:${job.slug}`);
  return { ok: true, name: job.jobSheetName ?? "fiche.pdf" };
}

/** « Utiliser la fiche Jumanly »: the PDF joined is removed, talents get the drawn sheet. */
export async function rhRemoveSheetAction(jobId: string) {
  const id = z.string().trim().min(1).max(60).safeParse(jobId);
  if (!id.success) return { ok: false as const };
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
  try {
    await removeJobSheet(db, ctx, id.data);
  } catch (error) {
    if (error instanceof HireError) return { ok: false as const };
    throw error;
  }
  return { ok: true as const };
}
