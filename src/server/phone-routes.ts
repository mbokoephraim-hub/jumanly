import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/server/auth/session";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { isPhone } from "@/server/view";

/** The person's own space (no organization, no partner institution chosen): the talent's. */
async function personalSpace(userId: string) {
  const [space, partner] = await Promise.all([getActiveSpace(userId), getPartnerSpace(userId)]);
  return !space && !partner;
}

/**
 * The screens of the Modèle B: on a phone for everyone (talent and recruiter), and on a computer or
 * a tablet for the talent too (Ephraïm, 07/11/2026: « on doit trouver toutes les fonctionnalités, la
 * même logique, les mêmes idées » qu'au téléphone). The recruiter's computer keeps its own screens.
 */
export const isModelB = cache(async () => {
  if (await isPhone()) return true;
  const user = await getCurrentUser();
  return user ? personalSpace(user.id) : false;
});

/**
 * Modèle B, lot B9: an address of the previous talent design (an old link, a bookmark, an e-mail)
 * leads to its screen of the Modèle B, on a phone and, since 07/11/2026, on a computer. The
 * recruiter and the partner keep their pages.
 */
export async function phoneTalentRedirect(userId: string, target: string) {
  if (!(await personalSpace(userId))) return;
  redirect(target);
}

/** A talent (any device): the screens of the Modèle B, not the former pages (recruiters keep theirs). */
export async function isPhoneTalent(userId: string) {
  return personalSpace(userId);
}
