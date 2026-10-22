/**
 * The active space (« Personnel » or an organization), chosen in the space switcher and kept in a
 * cookie. It is checked against the person's memberships on every request (partie 03 § 3.4): a
 * cookie naming an organization the person no longer belongs to falls back to the personal space.
 */
import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { requireUser, type CurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { hireMemberships, resolveSpace } from "@/server/services/organization";

export const SPACE_COOKIE = "jm_space";

export const getActiveSpace = cache(async (userId: string) => {
  const wanted = (await cookies()).get(SPACE_COOKIE)?.value;
  const space = await resolveSpace(db, userId, wanted);
  // A suspended organization (Admin v2, étape 4) is no space: its members cannot act in Hire.
  return space && !space.organization.suspendedAt ? space : null;
});

export type ActiveSpace = NonNullable<Awaited<ReturnType<typeof getActiveSpace>>>;

export async function setActiveSpace(value: string) {
  (await cookies()).set(SPACE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

/**
 * Guard of every Hire page and action: session, then membership of the active organization.
 * Without an organization space, Hire pages do not exist for this person.
 */
export async function requireHire(
  suite = "/app/hire",
  need?: keyof ReturnType<typeof hirePermissions>,
): Promise<{ user: CurrentUser; space: ActiveSpace; ctx: HireContext }> {
  const user = await requireUser(suite);
  const space = await getActiveSpace(user.id);
  if (!space) {
    const memberships = await hireMemberships(db, user.id);
    redirect(
      memberships.some((membership) => membership.organization.suspendedAt)
        ? "/app/acces-refuse?raison=organisation"
        : "/app/acces-refuse",
    );
  }
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  if (need && !hirePermissions(space.role)[need]) notFound();
  return { user, space, ctx };
}

/** Connect viewer: the organization side when an organization space is active. */
export async function connectViewer(suite = "/app/messages") {
  const user = await requireUser(suite);
  const space = await getActiveSpace(user.id);
  const hire = space
    ? { userId: user.id, organizationId: space.organizationId, role: space.role }
    : null;
  return { user, space, viewer: { userId: user.id, hire } };
}

/**
 * Where a recruiter publishes in the Fil (Modèle B recruteur, M3): the active organization, whose
 * offers may be joined to a post, and whether the person may publish in its name — a member who
 * manages the offers, in a company page (never the space under their own name).
 */
export async function publishingSpace(userId: string) {
  const space = await getActiveSpace(userId);
  if (!space) return null;
  const [personal, org] = await Promise.all([
    db.recruiterProfile.findFirst({
      where: { userId, personalOrganizationId: space.organizationId },
      select: { id: true },
    }),
    db.organization.findUniqueOrThrow({
      where: { id: space.organizationId },
      select: { name: true, logo: true },
    }),
  ]);
  return {
    organizationId: space.organizationId,
    canPublishAsOrg: hirePermissions(space.role).manage && !personal,
    org,
  };
}
