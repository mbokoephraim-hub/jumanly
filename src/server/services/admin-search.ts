/**
 * Jumanly Admin v2 · recherche globale (docs/admin-v2/PLAN-ADMIN.md, étape 1): accounts,
 * organizations, jobs, courses and plans by name, e-mail or identifier, grouped by kind. Content
 * editors only search the courses (the only section they open).
 */
import type { PrismaClient } from "@/generated/prisma/client";

export const SEARCH_LIMIT = 8;
export const SEARCH_KINDS = ["users", "organizations", "jobs", "courses", "plans"] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export type SearchHit = { id: string; title: string; detail: string | null; href: string };
export type SearchResults = Record<SearchKind, SearchHit[]>;

/** The kinds a platform role may search. */
export function searchKindsFor(role: string): readonly SearchKind[] {
  if (role === "content_editor") return ["courses"];
  if (role === "support_agent") return ["users", "organizations", "jobs", "plans"];
  if (role === "platform_admin") return SEARCH_KINDS;
  return [];
}

export function normalizeQuery(raw: string) {
  return raw.trim().replace(/\s+/g, " ").slice(0, 120);
}

export async function adminSearch(
  db: PrismaClient,
  raw: string,
  role: string,
): Promise<SearchResults> {
  const q = normalizeQuery(raw);
  const kinds = searchKindsFor(role);
  const empty: SearchResults = { users: [], organizations: [], jobs: [], courses: [], plans: [] };
  if (q.length < 2 || kinds.length === 0) return empty;
  const text = { contains: q, mode: "insensitive" as const };
  const wants = (kind: SearchKind) => kinds.includes(kind);

  const [users, organizations, jobs, courses, plans] = await Promise.all([
    wants("users")
      ? db.user.findMany({
          where: { OR: [{ email: text }, { name: text }, { id: q }] },
          select: { id: true, name: true, email: true },
          orderBy: { createdAt: "desc" },
          take: SEARCH_LIMIT,
        })
      : [],
    wants("organizations")
      ? db.organization.findMany({
          where: { OR: [{ name: text }, { slug: text }, { id: q }] },
          select: { id: true, name: true, city: true, country: true },
          orderBy: { createdAt: "desc" },
          take: SEARCH_LIMIT,
        })
      : [],
    wants("jobs")
      ? db.job.findMany({
          where: { OR: [{ title: text }, { slug: text }, { id: q }] },
          select: { id: true, title: true, organization: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: SEARCH_LIMIT,
        })
      : [],
    wants("courses")
      ? db.course.findMany({
          where: { OR: [{ title: text }, { slug: text }, { id: q }] },
          select: { id: true, title: true, slug: true },
          orderBy: { createdAt: "desc" },
          take: SEARCH_LIMIT,
        })
      : [],
    wants("plans")
      ? db.plan.findMany({
          where: { OR: [{ name: text }, { code: text }] },
          select: { code: true, name: true },
          orderBy: { sortOrder: "asc" },
          take: SEARCH_LIMIT,
        })
      : [],
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      title: user.name,
      detail: user.email,
      href: `/admin/utilisateurs?fiche=${user.id}`,
    })),
    organizations: organizations.map((org) => ({
      id: org.id,
      title: org.name,
      detail: [org.city, org.country].filter(Boolean).join(", ") || null,
      href: `/admin/organisations?fiche=${org.id}`,
    })),
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      detail: job.organization?.name ?? null,
      href: `/admin/offres?onglet=toutes&id=${job.id}`,
    })),
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title,
      detail: course.slug,
      href: `/admin/formations/${course.id}`,
    })),
    plans: plans.map((plan) => ({
      id: plan.code,
      title: plan.name,
      detail: plan.code,
      href: `/admin/forfaits/${plan.code}`,
    })),
  };
}
