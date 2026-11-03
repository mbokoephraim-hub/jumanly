"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { reorderCandidates } from "@/server/services/hire-offer-candidates";

const reorderSchema = z.object({
  job: z.string().min(1).max(60),
  ids: z.array(z.string().min(1).max(60)).min(1).max(2000),
});

/**
 * « Déplacer » a candidate in « Candidats » of an offer (Ephraïm, 03/11/2026). Order of CLAUDE.md:
 * validate → session → role and right (« Trier ») → service. The list already shows the new
 * order: the answer only says whether it was kept.
 */
export async function reorderCandidatesAction(input: { job: string; ids: string[] }) {
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const { ctx } = await requireHire(`/app/hire/offres/${parsed.data.job}`, "manage", "sort");
  try {
    await reorderCandidates(db, ctx, parsed.data.job, parsed.data.ids);
  } catch (error) {
    if (error instanceof HireError) return { ok: false as const };
    throw error;
  }
  return { ok: true as const };
}
