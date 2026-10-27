/**
 * Session reading for pages and server actions. Reading the request makes a page dynamic, so
 * callers sit inside a Suspense boundary.
 */
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { loginHref } from "@/lib/signup";
import { db } from "@/server/db";
import { auth } from "./index";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The signed-in user with the fields the app needs, or null. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(suite?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(suite));
  return user;
}

import { ADMIN_ROLES, ADMIN_SHELL_ROLES, adminAreas, CONTENT_ROLES, type AdminArea } from "./roles";

export { ADMIN_ROLES };

/**
 * Admin access: platform administrators (two-step verification required) and support agents
 * (read only). Anyone else gets a 404, so the admin is not revealed.
 */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!(ADMIN_ROLES as readonly string[]).includes(user.platformRole)) return null;
  if (user.platformRole === "platform_admin" && !user.twoFactorEnabled) {
    redirect("/app/parametres?onglet=securite&raison=deux-etapes");
  }
  return user;
}

/** Someone who may open the admin shell (administrators, support, content editors), or null. */
export async function requireAdminShell() {
  const user = await requireUser("/admin");
  if (!(ADMIN_SHELL_ROLES as readonly string[]).includes(user.platformRole)) return null;
  if (user.platformRole === "platform_admin" && !user.twoFactorEnabled) {
    redirect("/app/parametres?onglet=securite&raison=deux-etapes");
  }
  return user;
}

/** Someone who may open this section of the admin (administrators, support, delegated roles). */
export async function requireAdminArea(area: AdminArea) {
  const user = await requireAdminShell();
  return user && adminAreas(user.platformRole).includes(area) ? user : null;
}

/** The course editor: content editors and administrators (two-step verification required). */
export async function requireCourseEditor() {
  const user = await requireAdminShell();
  return user && (CONTENT_ROLES as readonly string[]).includes(user.platformRole) ? user : null;
}

export function canWriteAdmin(user: CurrentUser) {
  return user.platformRole === "platform_admin";
}
