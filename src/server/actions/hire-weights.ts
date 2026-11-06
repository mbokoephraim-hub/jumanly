"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { criterionKeys, type CriterionKey } from "@/server/matching/types";
import { HireError } from "@/server/services/hire";
import { saveJobWeights } from "@/server/services/hire-weights";

/**
 * « Poids du score » of an offer. Order of CLAUDE.md: validate → session → role and right
 * (« Trier ») → entitlement `hire.matching.weights` (in the service) → service.
 */
const weightSchema = z.coerce.number().int().min(0).max(100);

export async function saveJobWeightsAction(formData: FormData) {
  const job = String(formData.get("job") ?? "").slice(0, 60);
  if (!job) redirect("/app/hire/offres");
  const page = `/app/hire/offres/${job}/poids`;
  const reset = formData.get("reset") === "1";
  let values: Record<CriterionKey, number> | null = null;
  if (!reset) {
    const parsed = z
      .object(
        Object.fromEntries(criterionKeys.map((key) => [key, weightSchema])) as Record<
          CriterionKey,
          typeof weightSchema
        >,
      )
      .safeParse(Object.fromEntries(criterionKeys.map((key) => [key, formData.get(key) ?? 0])));
    if (!parsed.success) redirect(`${page}?erreur=1`);
    values = parsed.data;
  }
  const { ctx } = await requireHire(page, "manage", "sort");
  try {
    await saveJobWeights(db, ctx, job, values);
  } catch (error) {
    if (error instanceof HireError) redirect(`${page}?erreur=1`);
    throw error;
  }
  refresh();
  redirect(`${page}?ok=1`);
}
