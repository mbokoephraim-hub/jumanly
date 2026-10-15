"use server";

import { notFound, redirect } from "next/navigation";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  COST_CATEGORIES,
  costInputSchema,
  monthKey,
  parseUsd,
  saveMonthlyCosts,
} from "@/server/services/admin-insights";

const PAGE = "/admin/indicateurs/couts";

/** « Enregistrer les coûts » of a month (Admin v2, étape 2): administrators only, audited. */
export async function saveCostsAction(formData: FormData) {
  const input = costInputSchema.safeParse(Object.fromEntries(formData));
  const admin = await requireAdmin();
  if (!admin) notFound();
  if (!canWriteAdmin(admin)) redirect("/admin?erreur=lecture");
  if (!input.success) redirect(`${PAGE}?erreur=1`);
  const amounts = Object.fromEntries(
    COST_CATEGORIES.map((category) => [category, parseUsd(input.data[category])]),
  );
  if (Object.values(amounts).some((value) => value === null)) {
    redirect(`${PAGE}?erreur=1&mois=${monthKey(input.data.month)}`);
  }
  await saveMonthlyCosts(
    db,
    admin.id,
    input.data.month,
    amounts as Record<(typeof COST_CATEGORIES)[number], number>,
    input.data.note,
  );
  redirect(`${PAGE}?ok=1&mois=${monthKey(input.data.month)}`);
}
