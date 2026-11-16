"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { toggleVivierFavorite } from "@/server/services/hire-v3-vivier";

/**
 * Heart of a Vivier card (Hire v3): adds the talent to the favourites or takes it out. Order of
 * CLAUDE.md: validate → session → role → service. The page comes back on the same tab.
 */
const PAGE = "/app/hire/viviers";

export async function hv3ToggleFavoriteAction(formData: FormData) {
  const profileId = String(formData.get("profile") ?? "");
  const tab = String(formData.get("onglet") ?? "");
  const back = /^(favoris|relances)$/.test(tab) ? `${PAGE}?onglet=${tab}` : PAGE;
  if (!/^[\w-]{1,60}$/.test(profileId)) redirect(back);
  const { ctx } = await requireHire(PAGE, "readApplications");
  try {
    await toggleVivierFavorite(db, ctx, profileId);
  } catch (error) {
    if (!(error instanceof HireError)) throw error;
  }
  refresh();
  redirect(back);
}
