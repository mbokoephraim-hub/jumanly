"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { onApplicationCreated } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { applyToJob, toggleSavedJob, withdrawApplication } from "@/server/services/applications";
import { applySteps, saveApplicationDraft } from "@/server/services/application-draft";
import { isJobOpen } from "@/server/services/jobs";
import { reportError } from "@/server/observability";

const applySchema = z.object({
  job: z.string().min(1).max(200),
  cv: z.string().max(60).default(""),
  coverLetter: z.string().max(5000).default(""),
  /** Staged form (prompt 4): the consent box of the review step must be ticked. */
  staged: z.literal("1").optional(),
  consent: z.literal("on").optional(),
});

/**
 * « Envoyer ma candidature ». Order (CLAUDE.md): validate → session → service. No entitlement and
 * no quota on purpose: applying is always free (golden rule n° 1).
 */
export async function applyAction(formData: FormData) {
  const parsed = applySchema.safeParse({
    job: formData.get("job"),
    cv: formData.get("cv") ?? "",
    coverLetter: formData.get("coverLetter") ?? "",
    staged: formData.get("staged") ?? undefined,
    consent: formData.get("consent") ?? undefined,
  });
  if (!parsed.success) redirect("/app/jobs");
  const { job, cv, coverLetter } = parsed.data;
  const user = await requireUser(`/app/jobs/${job}`);
  if (parsed.data.staged && !parsed.data.consent)
    redirect(`/app/jobs/${job}?postuler=1&etape=verification`);
  const result = await applyToJob(db, {
    userId: user.id,
    jobSlug: job,
    cvDocumentId: cv || null,
    coverLetter,
  });
  if (result.status === "notFound") redirect("/app/jobs");
  if (result.status === "applied") {
    await onApplicationCreated(result.applicationId).catch((error) => reportError(error));
  }
  const outcome = { applied: "envoyee", already: "deja", closed: "close" }[result.status];
  redirect(`/app/jobs/${job}?candidature=${outcome}`);
}

export async function withdrawAction(formData: FormData) {
  const user = await requireUser("/app/jobs/candidatures");
  await withdrawApplication(db, user.id, String(formData.get("id") ?? ""));
  redirect("/app/jobs/candidatures?onglet=terminees&ok=retiree");
}

const safeBack = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value : "";
  return text.startsWith("/app/jobs") && !text.startsWith("//") ? text : "/app/jobs";
};

export async function toggleSaveAction(formData: FormData) {
  const user = await requireUser("/app/jobs");
  await toggleSavedJob(db, user.id, String(formData.get("job") ?? ""));
  redirect(safeBack(formData.get("back")));
}

export async function clearClosedSavedJobs() {
  const user = await requireUser("/app/jobs/enregistrees");
  const now = new Date();
  await db.savedJob.deleteMany({
    where: {
      userId: user.id,
      job: { OR: [{ status: { not: "published" } }, { closesAt: { lte: now } }] },
    },
  });
  redirect("/app/jobs/enregistrees");
}

const stepSchema = z.object({
  job: z.string().min(1).max(200),
  step: z.enum(applySteps),
  next: z.enum([...applySteps, "quitter"]),
  cv: z.string().max(60).optional(),
  coverLetter: z.string().max(5000).optional(),
});

/**
 * One step of the staged application (docs/ux-mobile-talent, prompt 4): saves the draft on the
 * server, then goes to the next step, or back to the offer with « Quitter ». Free like applying:
 * no entitlement, no quota.
 */
export async function saveApplicationStepAction(formData: FormData) {
  const parsed = stepSchema.safeParse({
    job: formData.get("job"),
    step: formData.get("step"),
    next: formData.get("next"),
    cv: formData.get("cv") ?? undefined,
    coverLetter: formData.get("coverLetter") ?? undefined,
  });
  if (!parsed.success) redirect("/app/jobs");
  const { job: slug, step, next, cv, coverLetter } = parsed.data;
  const user = await requireUser(`/app/jobs/${slug}?postuler=1`);
  const job = await db.job.findUnique({
    where: { slug },
    select: { id: true, status: true, closesAt: true },
  });
  if (!job) redirect("/app/jobs");
  if (!isJobOpen(job)) redirect(`/app/jobs/${slug}?candidature=close`);
  await saveApplicationDraft(db, {
    userId: user.id,
    jobId: job.id,
    step: next === "quitter" ? step : next,
    ...(step === "cv" &&
      cv !== undefined && {
        cv:
          cv === "profil"
            ? { documentId: null, profileOnly: true }
            : { documentId: cv || null, profileOnly: false },
      }),
    ...(step === "lettre" && coverLetter !== undefined && { coverLetter }),
  });
  redirect(
    next === "quitter"
      ? `/app/jobs/${slug}?brouillon=1`
      : `/app/jobs/${slug}?postuler=1&etape=${next}`,
  );
}

/**
 * Saves or unsaves an offer from the page, without leaving it (prompt 4): the toast that follows
 * offers « Annuler », which calls this again with the opposite value. Returns the new state.
 */
export async function setJobSavedAction(slug: string, saved: boolean): Promise<boolean | null> {
  const parsed = z.object({ slug: z.string().min(1).max(200), saved: z.boolean() }).safeParse({
    slug,
    saved,
  });
  if (!parsed.success) return null;
  const user = await requireUser("/app/jobs");
  const job = await db.job.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (!job) return null;
  const key = { userId_jobId: { userId: user.id, jobId: job.id } };
  if (parsed.data.saved)
    await db.savedJob.upsert({
      where: key,
      update: {},
      create: { userId: user.id, jobId: job.id },
    });
  else await db.savedJob.deleteMany({ where: { userId: user.id, jobId: job.id } });
  return parsed.data.saved;
}
