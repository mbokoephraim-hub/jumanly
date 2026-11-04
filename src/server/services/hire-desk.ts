import type { ApplicationStatus, PrismaClient } from "@/generated/prisma/client";
import type { HireContext } from "./hire";
import { HOLD_EVENT, HOLD_LIFTED_EVENT, isOnHold } from "./hire-classes";

/**
 * The recruiter's desk for one offer (Ephraïm, 03/11/2026, « Candidatures recruteur :
 * proposition »): each candidate sits where the recruiter has something to do with them.
 * - « À trier »: applied, not retained yet, not set aside (Orbi's classes help).
 * - « À compléter »: set aside « En attente » (a document asked from the file's proposals puts
 *   the person there, Ephraïm 04/11/2026), or retained with a piece still missing.
 * - « Entretiens »: retained, the file complete (or nothing asked): ready to meet.
 * - « Décision »: hired, not retained, or withdrawn.
 */
export const DESK_RUBRIQUES = ["trier", "completer", "entretiens", "decision"] as const;
export type DeskRubrique = (typeof DESK_RUBRIQUES)[number];

export type DeskInput = {
  status: ApplicationStatus;
  shortlistedAt: Date | null;
  verification: { items: { required: boolean; receivedAt: Date | null }[] } | null;
  /** « En attente » and its lifting (hold events, oldest first). */
  events?: readonly { type: string }[];
};

export function rubriqueOf(application: DeskInput): DeskRubrique {
  if (application.status !== "active") return "decision";
  if (isOnHold(application.events ?? [])) return "completer";
  if (!application.shortlistedAt) return "trier";
  const missing = application.verification?.items.some(
    (item) => item.required && item.receivedAt === null,
  );
  return missing ? "completer" : "entretiens";
}

export const deskSelect = {
  status: true as const,
  shortlistedAt: true as const,
  verification: {
    select: { items: { select: { required: true as const, receivedAt: true as const } } },
  },
  events: {
    where: { type: { in: [HOLD_EVENT, HOLD_LIFTED_EVENT] as string[] } },
    orderBy: { createdAt: "asc" as const },
    select: { type: true as const, createdAt: true as const },
  },
};

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
