import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";

/**
 * True when the person works in an organization or partner space: those keep their own screens
 * until their redesign (docs/PLAN-REFONTE-EN-3-ETAPES.md, étapes 2 and 3).
 */
export async function inOrganizationSpace(userId: string) {
  const [space, partner] = await Promise.all([getActiveSpace(userId), getPartnerSpace(userId)]);
  return Boolean(space || partner);
}
