/** Platform roles that open Jumanly Admin (support agents read only). */
export const ADMIN_ROLES = ["platform_admin", "support_agent"] as const;

/** Roles that edit Learn courses in the admin (partie 05: content editors and administrators). */
export const CONTENT_ROLES = ["platform_admin", "content_editor"] as const;

/**
 * Delegated roles (27/10/2026): each one opens only its sections of the admin, and may act there.
 * Responsable formation = `content_editor`.
 */
export const DELEGATED_ROLES = ["content_editor", "career_manager", "moderator"] as const;

/** Everyone who sees the admin shell. */
export const ADMIN_SHELL_ROLES = [...ADMIN_ROLES, ...DELEGATED_ROLES] as const;

/** Sections of the admin, one per entry of the side bar. */
export const ADMIN_AREAS = [
  "dashboard",
  "users",
  "organizations",
  "partners",
  "plans",
  "subscriptions",
  "courses",
  "content",
  "jobs",
  "reports",
  "ai",
  "audit",
] as const;
export type AdminArea = (typeof ADMIN_AREAS)[number];

const DELEGATED_AREAS: Record<(typeof DELEGATED_ROLES)[number], readonly AdminArea[]> = {
  content_editor: ["courses", "content"],
  career_manager: ["content", "jobs", "ai"],
  moderator: ["jobs", "reports"],
};

function isDelegated(role: string): role is (typeof DELEGATED_ROLES)[number] {
  return (DELEGATED_ROLES as readonly string[]).includes(role);
}

/** The sections a platform role sees (support agents read everything but the editing tools). */
export function adminAreas(role: string): readonly AdminArea[] {
  if (role === "platform_admin") return ADMIN_AREAS;
  if (role === "support_agent")
    return ADMIN_AREAS.filter((area) => area !== "courses" && area !== "content");
  return isDelegated(role) ? DELEGATED_AREAS[role] : [];
}

/** May this role act (not only read) in this section? */
export function canWriteArea(role: string, area: AdminArea) {
  if (role === "platform_admin") return true;
  return isDelegated(role) && DELEGATED_AREAS[role].includes(area);
}
