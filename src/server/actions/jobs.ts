"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { onApplicationCreated } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { applyToJob, toggleSavedJob, withdrawApplication } from "@/server/services/applications";

const applySchema = z.object({
  job: z.string().min(1).max(200),
  cv: z.string().max(60).default(""),
  coverLetter: z.string().max(5000).default(""),
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
  });
  if (!parsed.success) redirect("/app/jobs");
  const { job, cv, coverLetter } = parsed.data;
  const user = await requireUser(`/app/jobs/${job}`);
  const result = await applyToJob(db, {
    userId: user.id,
    jobSlug: job,
    cvDocumentId: cv || null,
    coverLetter,
  });
  if (result.status === "notFound") redirect("/app/jobs");
  if (result.status === "applied") {
    await onApplicationCreated(result.applicationId).catch((error) => console.error(error));
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
