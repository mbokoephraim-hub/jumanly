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
