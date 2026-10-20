"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { HireError, getOrgJob, pauseJob, publishJob, resumeJob } from "@/server/services/hire";
import {
  attachJobSheet,
  jobSheetPagesOf,
  JobSheetError,
  jobSteps,
  removeJobSheet,
  saveJobStep,
  type JobStep,
} from "@/server/services/hire-offers";
import { proposeFromSheet, type SheetProposal } from "@/server/services/job-writer";

const OFFERS = "/app/hire/offres";
const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const stepHref = (jobId: string, step: number, params = "") =>
  `${OFFERS}/${jobId}/modifier?etape=${step}${params ? `&${params}` : ""}`;

function refresh(slug: string) {
  updateTag("jobs");
  updateTag(`job:${slug}`);
}

async function guarded<T>(work: () => Promise<T>, fallback = OFFERS): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HireError) redirect(fallback);
    throw error;
  }
}

/**
 * One step of « Nouvelle offre » (planche recruteur-1 CR1 to CR3): saved at once, then the next
 * step, the step before, or « Plus tard » (back to Mes offres, the draft kept). On the third step
 * the job sheet in PDF is checked before it is kept.
 */
export async function saveJobStepAction(formData: FormData) {
  const { ctx } = await requireHire(OFFERS, "manage");
  const jobId = id(formData.get("id")) || undefined;
  const step = String(formData.get("step") ?? "") as JobStep;
  const index = jobSteps.indexOf(step);
  if (index < 0 || step === "verifier") redirect(OFFERS);
  const next = String(formData.get("next") ?? "continue");
  const leaving = next === "later" || next === "quitter";

  const raw = {
    ...Object.fromEntries(formData),
    documents: formData.getAll("documents").map(String),
  };
  const result = await guarded(() =>
    saveJobStep(db, ctx, step as Exclude<JobStep, "verifier">, raw, jobId),
  );
  if (!result.ok) {
    // Leaving a new offer that is not valid yet: nothing to keep.
    if (leaving && !jobId) redirect(OFFERS);
    const params = new URLSearchParams({ erreur: result.error, champ: result.field ?? "" });
    if (result.unknownSkills) params.set("inconnues", result.unknownSkills.join(", "));
    redirect(
      jobId
        ? stepHref(jobId, index + 1, params.toString())
        : `${OFFERS}/nouvelle?${params.toString()}`,
    );
  }

  const saved = result.jobId;
  if (step === "candidature") {
    const file = formData.get("sheet");
    if (formData.get("sheetRemove") === "1") {
      await guarded(() => removeJobSheet(db, ctx, saved));
      redirect(stepHref(saved, 3, "ok=fiche-retiree"));
    }
    if (file instanceof File && file.size > 0) {
      try {
        await attachJobSheet(db, ctx, saved, {
          name: file.name,
          bytes: new Uint8Array(await file.arrayBuffer()),
        });
      } catch (error) {
        if (error instanceof JobSheetError) redirect(stepHref(saved, 3, `fiche=${error.code}`));
        throw error;
      }
      if (next === "upload") redirect(stepHref(saved, 3, "ok=fiche"));
    }
  }
  const job = await db.job.findUniqueOrThrow({
    where: { id: saved },
    select: { slug: true, status: true },
  });
  if (job.status === "published" || job.status === "paused") refresh(job.slug);
  if (leaving)
    redirect(
      job.status === "draft" || job.status === "rejected" || job.status === "changes_requested"
        ? `${OFFERS}?onglet=brouillons&ok=brouillon`
        : `${OFFERS}/${saved}?ok=enregistree`,
    );
  if (next === "back") redirect(stepHref(saved, Math.max(1, index)));
  redirect(stepHref(saved, index + 2));
}

/** Step 4 · « Publier » or « Brouillon » (planche CR4); the limit opens its sheet (QUOTA). */
export async function publishOfferAction(formData: FormData) {
  const { ctx } = await requireHire(OFFERS, "manage");
  const jobId = id(formData.get("id"));
  if (formData.get("intent") === "draft") redirect(`${OFFERS}?onglet=brouillons&ok=brouillon`);
  const result = await guarded(() => publishJob(db, ctx, jobId));
  if (result.status === "limit") redirect(stepHref(jobId, 4, "limite=1"));
  if (result.status === "incomplete")
    redirect(stepHref(jobId, 2, `erreur=${result.missing}&champ=${result.missing}`));
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { slug: true } });
  refresh(job.slug);
  redirect(`${OFFERS}/${jobId}?publiee=${result.status === "published" ? "1" : "verification"}`);
}

/** Where to come back after an action of the « … » menu: Mes offres or the offer itself. */
function backTo(formData: FormData, fallback: string) {
  const from = String(formData.get("back") ?? "");
  return from.startsWith(`${OFFERS}`) && !from.startsWith("//") ? from.split("#")[0]! : fallback;
}

const withParam = (href: string, param: string) =>
  `${href}${href.includes("?") ? "&" : "?"}${param}`;

/** « Mettre en pause » (brief recruteur § 2.4): hidden from results, applications kept. */
export async function pauseJobAction(formData: FormData) {
  const { ctx } = await requireHire(OFFERS, "manage");
  const job = await guarded(() => pauseJob(db, ctx, id(formData.get("id"))));
  refresh(job.slug);
  redirect(withParam(backTo(formData, `${OFFERS}?onglet=pause`), "ok=pause"));
}

/** « Reprendre » a paused offer, within `jobs.active.max`. */
export async function resumeJobAction(formData: FormData) {
  const { ctx } = await requireHire(OFFERS, "manage");
  const jobId = id(formData.get("id"));
  const result = await guarded(() => resumeJob(db, ctx, jobId));
  const back = backTo(formData, `${OFFERS}?onglet=pause`);
  if (result.status === "limit") redirect(withParam(back, `limite=${jobId}`));
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { slug: true } });
  refresh(job.slug);
  redirect(withParam(back, "ok=reprise"));
}

/**
 * « Orbi a lu la fiche » (planche r1plus CR3): missions of the job sheet the offer does not have.
 * Proposed only; the recruiter applies them with `addResponsibilitiesAction`.
 */
export async function sheetProposalAction(jobId: string): Promise<SheetProposal> {
  const { ctx } = await requireHire(OFFERS, "manage");
  const job = await getOrgJob(db, ctx, String(jobId).slice(0, 60)).catch(() => null);
  if (!job) return { ok: false, error: "invalid" };
  return proposeFromSheet(db, ctx, {
    title: job.title,
    responsibilities: job.responsibilities,
    sheet: jobSheetPagesOf(job.jobSheetText),
  }).catch((error) => {
    reportError(error);
    return { ok: false, error: "unavailable" } as const;
  });
}

/** « Appliquer » a proposal of Orbi on step 3: the missions the recruiter kept, added at the end. */
export async function addResponsibilitiesAction(formData: FormData) {
  const { ctx } = await requireHire(OFFERS, "manage");
  const jobId = id(formData.get("id"));
  const job = await guarded(() => getOrgJob(db, ctx, jobId));
  const items = formData
    .getAll("item")
    .map((value) => String(value).replace(/\s+/g, " ").trim().slice(0, 300))
    .filter((value) => value.length >= 3)
    .slice(0, 5);
  const merged = [...job.responsibilities];
  for (const item of items) if (!merged.includes(item)) merged.push(item);
  await guarded(() =>
    saveJobStep(
      db,
      ctx,
      "description",
      {
        description: job.description,
        responsibilities: merged.slice(0, 20).join("\n"),
        requirements: job.requirements.join("\n"),
        benefits: job.benefits.join("\n"),
        requiredSkills: job.skills
          .filter((skill) => skill.importance === "required")
          .map((skill) => skill.skill.name)
          .join(", "),
        preferredSkills: job.skills
          .filter((skill) => skill.importance === "preferred")
          .map((skill) => skill.skill.name)
          .join(", "),
      },
      job.id,
    ),
  );
  redirect(stepHref(job.id, 3, `ok=missions&nombre=${items.length}`));
}
