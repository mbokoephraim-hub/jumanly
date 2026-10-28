import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { isPhone } from "@/server/view";

/**
 * Étape 3, A6: on a computer, the owner and the administrators of a company (a Company plan) pay
 * and read their invoices in « Formule et facturation » (`/app/organisation/facturation`). The
 * former subscription pages send them there; on a phone, and for every other member or
 * organization, they stay as they are.
 */
export async function sendCompanyAdminToBilling(
  space: Pick<HireContext, "organizationId" | "role"> | null,
) {
  if (!space || !hirePermissions(space.role).administer) return;
  if (await isPhone()) return;
  const plan = await resolvePlan(db, { type: "organization", id: space.organizationId });
  if (plan?.family === "company") redirect("/app/organisation/facturation");
}
