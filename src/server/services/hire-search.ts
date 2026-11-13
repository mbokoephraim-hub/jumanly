/**
 * The few results of `Ctrl K` in the recruiter's web frame (docs/refonte-web, brief § 2.4): the
 * offers and the candidates of the active organization whose words match, alternated, six at most.
 * Everything goes through `jobScope` (golden rule n° 6); candidates only for members who may read
 * applications (a viewer sees aggregated figures only). Names only: opening a file stays the
 * journaled consultation of the dossier.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, jobScope, type HireContext } from "./hire";

export type HirePreviewItem = { kind: "offer" | "candidate"; title: string; href: string };

export async function hireSearchPreview(
  db: PrismaClient,
  ctx: HireContext,
  query: string,
  max = 6,
  /** Fewest letters asked (two on a computer, one on the phone's search in two steps). */
  minLetters = 2,
): Promise<HirePreviewItem[]> {
  const words = query.trim().slice(0, 100);
  if (words.length < minLetters) return [];
  const scope = await jobScope(db, ctx);
  const contains = { contains: words, mode: "insensitive" as const };
  const [jobs, applications] = await Promise.all([
    db.job.findMany({
      where: { AND: [scope, { title: contains, status: { not: "archived" } }] },
      orderBy: { updatedAt: "desc" },
      take: max,
      select: { id: true, title: true },
    }),
    hirePermissions(ctx.role).readApplications
      ? db.application.findMany({
          where: { job: scope, profile: { user: { name: contains } } },
          orderBy: { createdAt: "desc" },
          take: max,
          select: {
            id: true,
            job: { select: { title: true } },
            profile: { select: { user: { select: { name: true } } } },
          },
        })
      : [],
  ]);
  const offers: HirePreviewItem[] = jobs.map((job) => ({
    kind: "offer",
    title: job.title,
    href: `/app/hire/offres/${job.id}`,
  }));
  const candidates: HirePreviewItem[] = applications.map((application) => ({
    kind: "candidate",
    title: `${application.profile.user.name} · ${application.job.title}`,
    href: `/app/hire/candidats/${application.id}`,
  }));
  const items: HirePreviewItem[] = [];
  for (let index = 0; items.length < max && index < max; index += 1) {
    if (candidates[index]) items.push(candidates[index]);
    if (items.length < max && offers[index]) items.push(offers[index]);
  }
  return items;
}

export type HirePaletteCandidate = {
  id: string;
  name: string;
  /** The talent's headline, or the offer when they gave none. */
  sub: string;
  score: number | null;
  href: string;
};
export type HirePaletteOffer = {
  id: string;
  title: string;
  status: "live" | "paused" | "draft";
  department: string | null;
  href: string;
};

/**
 * What `Ctrl K` of the recruiter's web app v3 lists (docs/mvp-web-recruteur/prototype-v3, palette):
 * the latest applications of the organization (names, headline, score shown when they applied) and
 * its offers, filtered in the browser as the person types. Everything goes through `jobScope`
 * (golden rule n° 6); candidates only for members who may read applications. Opening a file stays
 * the journaled consultation of the dossier.
 */
export async function hirePaletteIndex(
  db: PrismaClient,
  ctx: HireContext,
  max = { candidates: 40, offers: 30 },
): Promise<{ candidates: HirePaletteCandidate[]; offers: HirePaletteOffer[] }> {
  const scope = await jobScope(db, ctx);
  const [jobs, applications] = await Promise.all([
    db.job.findMany({
      where: {
        AND: [scope, { status: { in: ["published", "paused", "draft", "changes_requested"] } }],
      },
      orderBy: { updatedAt: "desc" },
      take: max.offers,
      select: { id: true, title: true, status: true, department: { select: { name: true } } },
    }),
    hirePermissions(ctx.role).readApplications
      ? db.application.findMany({
          where: { job: scope },
          orderBy: { createdAt: "desc" },
          take: max.candidates,
          select: {
            id: true,
            matchScore: true,
            job: { select: { title: true } },
            profile: { select: { headline: true, user: { select: { name: true } } } },
          },
        })
      : [],
  ]);
  return {
    candidates: applications.map((application) => ({
      id: application.id,
      name: application.profile.user.name,
      sub: application.profile.headline?.trim() || application.job.title,
      score: application.matchScore,
      href: `/app/hire/candidats/${application.id}`,
    })),
    offers: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status === "published" ? "live" : job.status === "paused" ? "paused" : "draft",
      department: job.department?.name ?? null,
      href: `/app/hire/offres/${job.id}`,
    })),
  };
}
