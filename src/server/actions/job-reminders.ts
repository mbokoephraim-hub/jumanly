"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { closeJob, HireError } from "@/server/services/hire";
import { prolongJob, prolongOptions } from "@/server/services/job-reminders";

/**
 * The actions of an end-of-offer reminder (planche 6 bis `FIN_PROL`, `FIN_CLO`). Order of
 * CLAUDE.md: validate → session → role → service.
 */

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const back = "/app/notifications";

const prolongSchema = z.object({
  job: z.string().min(1).max(60),
  days: z.enum(["7", "14", "30", "date"]),
  until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** « Prolonger l'offre »: +7, +14, +30 days or a date; the scheduled analysis follows. */
export async function prolongJobAction(formData: FormData) {
  const { ctx } = await requireHire(back, "manage");
  const parsed = prolongSchema.safeParse({
    job: formData.get("job"),
    days: formData.get("days"),
    until: formData.get("until") || undefined,
  });
  if (!parsed.success || (parsed.data.days === "date" && !parsed.data.until))
    redirect(`${back}?fin=erreur`);
  const { job, days, until } = parsed.data;
  const value = Number(days);
  try {
    await prolongJob(
      db,
      ctx,
      job,
      days === "date"
        ? { until: new Date(`${until}T23:59:00Z`) }
        : { days: (prolongOptions as readonly number[]).includes(value) ? value : 7 },
    );
  } catch (error) {
    if (error instanceof HireError) redirect(`${back}?fin=erreur#fin-${job}`);
    throw error;
  }
  // Public job pages are cached: the new closing date shows there too.
  updateTag("jobs");
  redirect(`${back}?fin=prolongee`);
}

/**
 * « Clôturer maintenant », or « Annuler le recrutement »: the offer closes, then the grouped reply
 * to the candidates opens, to be read before anything is sent.
 */
export async function closeEndingJobAction(formData: FormData) {
  const { ctx } = await requireHire(back, "manage");
  const jobId = id(formData.get("job"));
  const cancel = formData.get("mode") === "annuler";
  try {
    await closeJob(db, ctx, jobId);
  } catch (error) {
    if (error instanceof HireError) redirect(`${back}?fin=erreur`);
    throw error;
  }
  updateTag("jobs");
  redirect(
    cancel ? `/app/hire/offres/${jobId}/reponses?groupe=non-retenus` : `${back}?fin=cloturee`,
  );
}
