/**
 * The recruiter's phone interface (Modèle B, docs/modele-b-recruteur): the figures of its bar and
 * of its tabs' heads. Every count goes through `jobScope` (golden rule n° 6): nothing of another
 * organization, and nothing a member may not read.
 */
import type { JobStatus, PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, jobScope, type HireContext } from "./hire";
import { unreadCount } from "./connect";
import { hireSearchPreview } from "./hire-search";

/** The lime count of Candidatures (applications nobody of the team opened yet) and Messages. */
export async function recruiterBarCounts(db: PrismaClient, ctx: HireContext) {
  const scope = await jobScope(db, ctx);
  const [newApplications, unreadMessages] = await Promise.all([
    hirePermissions(ctx.role).readApplications
      ? db.application.count({ where: { job: scope, viewedAt: null, status: "active" } })
      : 0,
    unreadCount(db, { userId: ctx.userId, hire: ctx }),
  ]);
  return { newApplications, unreadMessages };
}

/** « Rechercher dans » of the recruiter's search (planche Recruteur-offres-recherche). */
export const RH_SEARCH_SCOPES = [
  "tout",
  "offres",
  "candidats",
  "entreprises",
  "personnes",
] as const;
export type RhSearchScope = (typeof RH_SEARCH_SCOPES)[number];

export type PhoneSearchGroups = {
  offers: {
    href: string;
    title: string;
    city: string;
    status: JobStatus;
    applications: number;
  }[];
  candidates: { href: string; title: string; sub: string }[];
};

/**
 * Search in two steps, second step (brief § 3, rule 2): the offers and the candidates of the
 * active organization whose words match, from the first letter. Names only: opening a file stays
 * the journaled consultation of the dossier.
 */
export async function recruiterPhoneSearch(
  db: PrismaClient,
  ctx: HireContext,
  query: string,
): Promise<PhoneSearchGroups> {
  const words = query.trim().slice(0, 100);
  if (!words) return { offers: [], candidates: [] };
  // One letter is enough on the phone (the preview of the computer starts at two).
  const [items, scope] = await Promise.all([
    hireSearchPreview(db, ctx, words, 12, 1),
    jobScope(db, ctx),
  ]);
  const jobs = await db.job.findMany({
    where: {
      AND: [
        scope,
        { title: { contains: words, mode: "insensitive" }, status: { not: "archived" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      city: true,
      status: true,
      _count: { select: { applications: true } },
    },
  });
  return {
    offers: jobs.map((job) => ({
      href: `/app/hire/offres/${job.id}`,
      title: job.title,
      city: job.city,
      status: job.status,
      applications: job._count.applications,
    })),
    candidates: items
      .filter((item) => item.kind === "candidate")
      .map((item) => {
        const [name, ...job] = item.title.split(" · ");
        return { href: item.href, title: name, sub: job.join(" · ") };
      }),
  };
}
