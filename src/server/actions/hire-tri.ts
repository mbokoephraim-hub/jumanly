"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { markCriterion, sortGesture, sortGestures } from "@/server/services/hire-tri";

/**
 * Sorting gestures of the pipeline (« Logique du recrutement », étape 5). Order of CLAUDE.md:
 * validate → session → role and right (« Trier ») → service. Nothing here answers or rejects a
 * candidate: « Ne pas retenir » goes through the decision screen and its message.
 */

/** Only a way back inside the offer's pipeline is followed. */
function backOf(value: FormDataEntryValue | null, jobId: string) {
  const back = String(value ?? "");
  return back.startsWith(`/app/hire/offres/${jobId}?vue=candidats`)
    ? back
    : `/app/hire/offres/${jobId}?vue=candidats`;
}

const withParams = (href: string, params: Record<string, string | null>) => {
  const url = new URL(href, "https://jumanly.local");
  for (const [key, value] of Object.entries(params))
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
};

const gestureSchema = z.object({
  application: z.string().min(1).max(60),
  job: z.string().min(1).max(60),
  gesture: z.enum(sortGestures),
});

export async function sortGestureAction(formData: FormData) {
  const input = gestureSchema.safeParse({
    application: formData.get("application"),
    job: formData.get("job"),
    gesture: formData.get("gesture"),
  });
  if (!input.success) redirect("/app/hire/offres");
  const { ctx } = await requireHire("/app/hire/offres", "manage", "sort");
  const back = backOf(formData.get("back"), input.data.job);
  try {
    await sortGesture(db, ctx, input.data.application, input.data.gesture);
  } catch (error) {
    if (error instanceof HireError) redirect(withParams(back, { geste: null, cible: null }));
    throw error;
  }
  const undone = input.data.gesture.startsWith("annuler-");
  refresh();
  redirect(
    withParams(back, {
      geste: undone ? null : input.data.gesture,
      cible: undone ? null : input.data.application,
    }),
  );
}

const criterionSchema = z.object({
  application: z.string().min(1).max(60),
  job: z.string().min(1).max(60),
  label: z.string().min(1).max(160),
  missing: z.enum(["1", "0"]),
});

export async function markCriterionAction(formData: FormData) {
  const input = criterionSchema.safeParse({
    application: formData.get("application"),
    job: formData.get("job"),
    label: formData.get("label"),
    missing: formData.get("missing"),
  });
  if (!input.success) redirect("/app/hire/offres");
  const { ctx } = await requireHire("/app/hire/offres", "manage", "sort");
  const back = backOf(formData.get("back"), input.data.job);
  try {
    await markCriterion(
      db,
      ctx,
      input.data.application,
      input.data.label,
      input.data.missing === "1",
    );
  } catch (error) {
    if (error instanceof HireError) redirect(back);
    throw error;
  }
  refresh();
  redirect(back);
}
