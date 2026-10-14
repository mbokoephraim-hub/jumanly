/** Platform roles that open Jumanly Admin (support agents read only). */
export const ADMIN_ROLES = ["platform_admin", "support_agent"] as const;

/** Roles that edit Learn courses in the admin (partie 05: content editors and administrators). */
export const CONTENT_ROLES = ["platform_admin", "content_editor"] as const;

/** Everyone who sees the admin shell; content editors only see the courses. */
export const ADMIN_SHELL_ROLES = [...ADMIN_ROLES, "content_editor"] as const;
