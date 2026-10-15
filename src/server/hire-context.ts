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
import { resolveSpace } from "@/server/services/organization";

export const SPACE_COOKIE = "jm_space";

export const getActiveSpace = cache(async (userId: string) => {
  const wanted = (await cookies()).get(SPACE_COOKIE)?.value;
  return resolveSpace(db, userId, wanted);
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
  if (!space) redirect("/app/acces-refuse");
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
