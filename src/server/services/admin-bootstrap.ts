/**
 * First administrator of a hosted environment without database access (docs/decisions/2026-10-14-premier-administrateur.md).
 * ADMIN_BOOTSTRAP_EMAIL lists the e-mail addresses (comma separated) that become platform
 * administrators the first time they sign in, once their address is verified. Nothing happens
 * for anyone else, nor for an account that already has a platform role. The variable is meant to be
 * removed once the administrator exists; the next ones are named from /admin.
 */
import type { PrismaClient } from "@/generated/prisma/client";

export function bootstrapAdminEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@"));
}

type Candidate = { id: string; email: string; emailVerified: boolean; platformRole: string };

export function shouldBootstrapAdmin(user: Candidate, allowed: readonly string[]): boolean {
  return (
    user.emailVerified &&
    user.platformRole === "user" &&
    allowed.includes(user.email.trim().toLowerCase())
  );
}

/** Promotes the user when ADMIN_BOOTSTRAP_EMAIL names them; returns true when it did. */
export async function bootstrapAdminIfListed(
  db: Pick<PrismaClient, "user" | "auditLog">,
  user: Candidate,
  value = process.env.ADMIN_BOOTSTRAP_EMAIL,
): Promise<boolean> {
  if (!shouldBootstrapAdmin(user, bootstrapAdminEmails(value))) return false;
  await db.user.update({ where: { id: user.id }, data: { platformRole: "platform_admin" } });
  await db.auditLog.create({
    data: {
      action: "user.role",
      targetType: "user",
      targetId: user.id,
      metadata: { from: user.platformRole, to: "platform_admin", via: "ADMIN_BOOTSTRAP_EMAIL" },
    },
  });
  return true;
}
