import "server-only";
import { redirect } from "next/navigation";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { isPhone } from "@/server/view";

/**
 * Modèle B, lot B9: an address of the previous talent design, opened on a phone (an old link, a
 * bookmark, an e-mail), leads to its screen of the Modèle B. The recruiter and the partner keep
 * their pages, and so does a computer or a tablet.
 */
export async function phoneTalentRedirect(userId: string, target: string) {
  if (!(await isPhone())) return;
  const [space, partner] = await Promise.all([getActiveSpace(userId), getPartnerSpace(userId)]);
  if (space || partner) return;
  redirect(target);
}
