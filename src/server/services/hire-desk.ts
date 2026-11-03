import type { ApplicationStatus, PrismaClient } from "@/generated/prisma/client";
import type { HireContext } from "./hire";

/**
 * The recruiter's desk for one offer (Ephraïm, 03/11/2026, « Candidatures recruteur :
 * proposition »): each candidate sits where the recruiter has something to do with them.
 * - « À trier »: applied, not retained yet (Orbi's classes help, nobody is set aside).
 * - « À compléter »: retained, a piece asked is still missing.
 * - « Entretiens »: retained, the file complete (or nothing asked): ready to meet.
 * - « Décision »: hired, not retained, or withdrawn.
 */
export const DESK_RUBRIQUES = ["trier", "completer", "entretiens", "decision"] as const;
export type DeskRubrique = (typeof DESK_RUBRIQUES)[number];

export type DeskInput = {
  status: ApplicationStatus;
  shortlistedAt: Date | null;
  verification: { items: { required: boolean; receivedAt: Date | null }[] } | null;
};

export function rubriqueOf(application: DeskInput): DeskRubrique {
  if (application.status !== "active") return "decision";
  if (!application.shortlistedAt) return "trier";
  const missing = application.verification?.items.some(
    (item) => item.required && item.receivedAt === null,
  );
  return missing ? "completer" : "entretiens";
}

export const deskSelect = {
  status: true,
  shortlistedAt: true,
  verification: { select: { items: { select: { required: true, receivedAt: true } } } },
} as const;

export type DeskCounts = Record<DeskRubrique, number>;

export const emptyCounts = (): DeskCounts => ({
  trier: 0,
  completer: 0,
  entretiens: 0,
  decision: 0,
});

/** The counts of each rubrique for the offers given (only the organization's own). */
export async function deskCounts(
  db: PrismaClient,
  ctx: HireContext,
  jobIds: string[],
): Promise<Map<string, DeskCounts>> {
  const counts = new Map<string, DeskCounts>(jobIds.map((id) => [id, emptyCounts()]));
  if (jobIds.length === 0) return counts;
  const rows = await db.application.findMany({
    where: { jobId: { in: jobIds }, job: { organizationId: ctx.organizationId } },
    select: { jobId: true, ...deskSelect },
  });
  for (const row of rows) counts.get(row.jobId)![rubriqueOf(row)] += 1;
  return counts;
}
