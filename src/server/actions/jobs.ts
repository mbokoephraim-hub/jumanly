"use server";

import { refresh } from "next/cache";
import {
  screeningAnswersFor,
  screeningAnswersOf,
  screeningQuestionsOf,
} from "@/server/services/screening";
import { redirect } from "next/navigation";
import { z } from "zod";
import { onApplicationCreated } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { applyToJob, toggleSavedJob, withdrawApplication } from "@/server/services/applications";
import {
  applySteps,
  getApplicationDraft,
  saveApplicationDraft,
} from "@/server/services/application-draft";
import {
  ATTACHMENTS_MAX,
  parseRefs,
  type AttachmentRef,
} from "@/server/services/application-attachments";
import { countJobs, isJobOpen, parseJobFilters } from "@/server/services/jobs";
import { reportError } from "@/server/observability";

const applySchema = z.object({
  job: z.string().min(1).max(200),
  cv: z.string().max(60).default(""),
  coverLetter: z.string().max(5000).default(""),
  /** Staged form (planche talent-2 § 1): the documents joined come from the saved draft. */
  staged: z.literal("1").optional(),
});

/** The pages of « Postuler » (planche talent-2 § 1). */
const applyHref = (slug: string, step?: string) =>
  `/app/jobs/${slug}/postuler${step ? `?etape=${step}` : ""}`;

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
  });
  if (!parsed.success) redirect("/app/jobs");
  const { job, cv, coverLetter } = parsed.data;
  const user = await requireUser(`/app/jobs/${job}`);
  let attachments: AttachmentRef[] = [];
  let answers: Record<string, string> = {};
  if (parsed.data.staged) {
    const found = await db.job.findUnique({ where: { slug: job }, select: { id: true } });
    const draft = found && (await getApplicationDraft(db, user.id, found.id));
    attachments = parseRefs(draft?.attachments);
    answers = Object.fromEntries(
      screeningAnswersOf(draft?.screeningAnswers).map((item) => [item.id, item.answer]),
    );
  }
  const result = await applyToJob(db, {
    userId: user.id,
    jobSlug: job,
    cvDocumentId: cv || null,
    coverLetter,
    attachments,
    answers,
  });
  if (result.status === "notFound") redirect("/app/jobs");
  if (result.status === "applied") {
    await onApplicationCreated(result.applicationId).catch((error) => reportError(error));
    redirect(`/app/jobs/${job}/postuler?envoyee=1`);
  }
  redirect(`/app/jobs/${job}?candidature=${result.status === "already" ? "deja" : "close"}`);
}

export async function withdrawAction(formData: FormData) {
  const user = await requireUser("/app/suivi");
  await withdrawApplication(db, user.id, String(formData.get("id") ?? "").slice(0, 60));
  redirect("/app/suivi?vue=terminees&ok=retiree");
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

const stepSchema = z.object({
  job: z.string().min(1).max(200),
  step: z.enum(applySteps),
  next: z.enum([...applySteps, "quitter"]),
  cv: z.string().max(60).optional(),
  coverLetter: z.string().max(5000).optional(),
  /** Present when the form carries the whole list of joined documents (« type:id »). */
  attachments: z.literal("1").optional(),
  attachment: z
    .array(z.string().max(80))
    .max(ATTACHMENTS_MAX * 2)
    .default([]),
});

/**
 * One step of « Postuler » (planche talent-2 § 1): saves the draft on the server, then goes to the
 * next step, or back to the offer with « Quitter ». Free like applying: no entitlement, no quota.
 */
export async function saveApplicationStepAction(formData: FormData) {
  const parsed = stepSchema.safeParse({
    job: formData.get("job"),
    step: formData.get("step"),
    next: formData.get("next"),
    cv: formData.get("cv") ?? undefined,
    coverLetter: formData.get("coverLetter") ?? undefined,
    attachments: formData.get("attachments") ?? undefined,
    attachment: formData.getAll("attachment"),
  });
  if (!parsed.success) redirect("/app/jobs");
  const { job: slug, step, next, cv, coverLetter } = parsed.data;
  const user = await requireUser(applyHref(slug));
  const job = await db.job.findUnique({
    where: { slug },
    select: { id: true, status: true, closesAt: true, screeningQuestions: true },
  });
  if (!job) redirect("/app/jobs");
  if (!isJobOpen(job)) redirect(`/app/jobs/${slug}?candidature=close`);
  // The recruiter's questions, all optional (golden rule n° 1): what is answered is kept.
  const screeningAnswers =
    formData.get("answers") === "1"
      ? screeningAnswersFor(
          screeningQuestionsOf(job.screeningQuestions),
          Object.fromEntries(
            [...formData.entries()]
              .filter(([key]) => key.startsWith("answer-"))
              .map(([key, value]) => [key.slice(7), String(value)]),
          ),
        )
      : undefined;
  const attachments = parsed.data.attachments
    ? parsed.data.attachment.flatMap((value): AttachmentRef[] => {
        const [type, id] = value.split(":");
        return (type === "certificate" || type === "document") && id ? [{ type, id }] : [];
      })
    : undefined;
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
    ...(coverLetter !== undefined && { coverLetter }),
    ...(attachments && { attachments }),
    ...(screeningAnswers && { screeningAnswers }),
  });
  refresh();
  redirect(next === "quitter" ? `/app/jobs/${slug}?brouillon=1` : applyHref(slug, next));
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

/**
 * Live count of the filter sheet (« Voir 24 offres »): valider → session → service. The values
 * are the query string the sheet will send; invalid ones are ignored, as in the search.
 */
export async function countOffersAction(values: Record<string, string>): Promise<number> {
  await requireUser("/app/jobs");
  const raw = Object.fromEntries(
    Object.entries(values ?? {})
      .filter(([key, value]) => typeof key === "string" && typeof value === "string")
      .slice(0, 20),
  );
  return countJobs(db, parseJobFilters(raw));
}
