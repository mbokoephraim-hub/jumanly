/**
 * The partner space (Jumanly Partners, E9): a partner manager chooses their institution in the
 * space switcher. Every partner page and action starts here: session, then an active
 * `partner_manager` membership of a partner organization (partie 10 § 10.2).
 */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { SPACE_COOKIE } from "@/server/hire-context";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import type { PartnerContext } from "@/server/services/partners";

/**
 * The partner organization chosen in the switcher, or null when another space is active. Without
 * a choice, a person who only manages a partner (no recruiting organization) lands in it.
 */
export const getPartnerSpace = cache(async (userId: string) => {
  const wanted = (await cookies()).get(SPACE_COOKIE)?.value;
  if (wanted === "personal") return null;
  const memberships = await partnerMemberships(db, userId);
  if (wanted) return memberships.find((item) => item.organizationId === wanted) ?? null;
  if (memberships.length === 0 || (await hireMemberships(db, userId)).length > 0) return null;
  return memberships[0] ?? null;
});

export async function requirePartner(suite = "/app/partenaire") {
  const user = await requireUser(suite);
  const memberships = await partnerMemberships(db, user.id);
  const wanted = (await cookies()).get(SPACE_COOKIE)?.value;
  const membership =
    memberships.find((item) => item.organizationId === wanted) ?? memberships[0] ?? null;
  if (!membership) redirect("/app");
  const ctx: PartnerContext = { userId: user.id, organizationId: membership.organizationId };
  return { user, ctx, organization: membership.organization };
}
