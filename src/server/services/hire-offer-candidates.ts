import { z } from "zod";
import type {
  ApplicationStatus,
  Availability,
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";
import { level } from "@/server/entitlements";
import { getOrgJob, HireError, hirePermissions, type HireContext } from "./hire";
import { filtersLevelOf, type FiltersLevel } from "./hire-filters";
import { emptyCounts, rubriqueOf, type DeskRubrique } from "./hire-desk";

/**
 * « Candidats » of an offer on the recruiter's phone (Ephraïm, 03/11/2026): every person who
 * applied, in the order they applied, unless the recruiter moved the cards (`recruiterRank`).
 * Orbi's analysis never changes this order: it has its own screen.
 */

export const candidateAvailabilities = ["open", "listening", "not_looking"] as const;

/** The search and the filters of the list, read from the address (never saved). */
export const candidateSearchSchema = z.object({
  q: z.string().trim().max(80).catch("").default(""),
  skill: z.string().trim().max(60).catch("").default(""),
  dispo: z.enum(candidateAvailabilities).optional().catch(undefined),
  ville: z.string().trim().max(60).catch("").default(""),
});
export type CandidateSearch = z.infer<typeof candidateSearchSchema>;

/** The skill, availability and place filters follow `hire.ats.filters` (all levels search). */
export function allowedSearch(
  search: CandidateSearch,
  filtersLevel: FiltersLevel,
): CandidateSearch {
  return filtersLevel === "all" ? search : { q: search.q, skill: "", ville: "" };
}

export const searchCount = (search: CandidateSearch) =>
  [search.skill, search.dispo, search.ville].filter(Boolean).length;

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export type OfferCandidate = {
  id: string;
  /** Null when the offer is sorted blind and the person is not retained yet. */
  name: string | null;
  image: string | null;
  headline: string | null;
  city: string | null;
  availability: Availability;
  createdAt: Date;
  shortlisted: boolean;
  unseen: boolean;
  /** 1, 2, 3… in the order of application: « Candidat 3 » when sorted blind. */
  number: number;
  /** Where the recruiter works on them (03/11/2026): À trier, À compléter, Entretiens, Décision. */
  rubrique: DeskRubrique;
  status: ApplicationStatus;
  /** « À compléter »: the pieces asked and received, the date limit. */
  pieces: { required: number; received: number; dueAt: Date } | null;
};

/** Order of the list: the recruiter's places first, then the order of application. */
export function orderCandidates<
  T extends { recruiterRank: number | null; createdAt: Date; id: string },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.recruiterRank !== null && b.recruiterRank !== null && a.recruiterRank !== b.recruiterRank)
      return a.recruiterRank - b.recruiterRank;
    if (a.recruiterRank !== null && b.recruiterRank === null) return -1;
    if (a.recruiterRank === null && b.recruiterRank !== null) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
  });
}

/**
 * All the applications of an offer of the organization (`getOrgJob` scopes it), withdrawn ones
 * aside, with what the card shows. `shortlistedOnly` gives « Retenus ».
 */
export async function offerCandidates(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  search: CandidateSearch,
  options: { shortlistedOnly?: boolean; rubrique?: DeskRubrique } = {},
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const filtersLevel = filtersLevelOf(
    await level(db, { type: "organization", id: ctx.organizationId }, "hire.ats.filters"),
  );
  const applied = allowedSearch(search, filtersLevel);
  const where: Prisma.ApplicationWhereInput = {
    jobId: job.id,
    job: { organizationId: ctx.organizationId },
    // Withdrawn applications only show in « Décision ».
    ...(options.rubrique === "decision" ? {} : { status: { not: "withdrawn" } }),
  };
  const rows = await db.application.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
      viewedAt: true,
      shortlistedAt: true,
      recruiterRank: true,
      status: true,
      verification: {
        select: { dueAt: true, items: { select: { required: true, receivedAt: true } } },
      },
      profile: {
        select: {
          headline: true,
          availability: true,
          user: { select: { name: true, image: true, city: true } },
          skills: { select: { skill: { select: { name: true } } } },
        },
      },
    },
  });
  // « Candidat 3 » counts in the order of application, whatever the places.
  const numbers = new Map(
    [...rows]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
      .map((row, index) => [row.id, index + 1]),
  );
  const q = fold(applied.q);
  const skill = fold(applied.skill);
  const ville = fold(applied.ville);
  const blind = job.blindSort;
  const shown = orderCandidates(rows).filter((row) => {
    if (options.shortlistedOnly && !row.shortlistedAt) return false;
    if (options.rubrique && rubriqueOf(row) !== options.rubrique) return false;
    const skills = row.profile.skills.map((item) => fold(item.skill.name));
    const hidden = blind && !row.shortlistedAt;
    if (
      q &&
      ![hidden ? "" : (row.profile.user.name ?? ""), row.profile.headline ?? "", ...skills].some(
        (text) => fold(text).includes(q),
      )
    )
      return false;
    if (skill && !skills.some((name) => name.includes(skill))) return false;
    if (applied.dispo && row.profile.availability !== applied.dispo) return false;
    if (ville && !fold(row.profile.user.city ?? "").includes(ville)) return false;
    return true;
  });
  const candidates: OfferCandidate[] = shown.map((row) => {
    const hidden = blind && !row.shortlistedAt;
    return {
      id: row.id,
      name: hidden ? null : row.profile.user.name,
      image: hidden ? null : row.profile.user.image,
      headline: row.profile.headline,
      city: row.profile.user.city,
      availability: row.profile.availability,
      createdAt: row.createdAt,
      shortlisted: Boolean(row.shortlistedAt),
      unseen: !row.viewedAt,
      number: numbers.get(row.id) ?? 0,
      rubrique: rubriqueOf(row),
      status: row.status,
      pieces: row.verification
        ? {
            required: row.verification.items.filter((item) => item.required).length,
            received: row.verification.items.filter((item) => item.required && item.receivedAt)
              .length,
            dueAt: row.verification.dueAt,
          }
        : null,
    };
  });
  const counts = emptyCounts();
  for (const row of rows) counts[rubriqueOf(row)] += 1;
  if (options.rubrique !== "decision") {
    // The withdrawn ones were left out of the query: count them for « Décision » too.
    counts.decision += await db.application.count({
      where: { jobId: job.id, job: { organizationId: ctx.organizationId }, status: "withdrawn" },
    });
  }
  return {
    job,
    candidates,
    total: rows.filter((row) => row.status !== "withdrawn").length,
    shortlisted: rows.filter((row) => row.shortlistedAt && row.status !== "withdrawn").length,
    counts,
    search: applied,
    filtersLevel,
  };
}

/**
 * « Déplacer » a card (long press, or the arrows): the whole order of the offer's applications,
 * as the recruiter sees it. Ids that are not the offer's are refused; the ones left out keep
 * their order after the others.
 */
export async function reorderCandidates(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  ids: string[],
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const rows = await db.application.findMany({
    where: { jobId: job.id, job: { organizationId: ctx.organizationId } },
    select: { id: true, recruiterRank: true, createdAt: true },
  });
  const known = new Set(rows.map((row) => row.id));
  if (ids.some((id) => !known.has(id)) || new Set(ids).size !== ids.length)
    throw new HireError("notFound");
  const rest = orderCandidates(rows.filter((row) => !ids.includes(row.id))).map((row) => row.id);
  const order = [...ids, ...rest];
  await db.$transaction(
    order.map((id, index) =>
      db.application.update({ where: { id }, data: { recruiterRank: index + 1 } }),
    ),
  );
  return order;
}
