/**
 * Orbi's classes in the pipeline (« JUMANLY Hire, logique du recrutement », Ephraïm 01/11/2026):
 * every analysed candidate falls in one of four classes, from the deterministic match score
 * (partie 08) and the elimination criteria the recruiter marked as missing. A fixed rule, the same
 * for every candidate of the offer: it sorts, it never rejects. « Hors critères » stays visible
 * with the missing criterion, and the recruiter can put the person back in the list.
 *
 * No plan name here: whether the classes are shown depends on the matching level of the
 * organization (entitlement `hire.matching.level`), read by the caller.
 */

export const orbiClasses = ["fort", "considerer", "limite", "hors"] as const;
export type OrbiClass = (typeof orbiClasses)[number];

/** « Fort potentiel » from this score (document validé : 75 %). */
export const CLASS_STRONG = 75;
/** « À considérer » from this score, « Limité » below (document validé : 50 %). */
export const CLASS_CONSIDER = 50;

/** Events of an application that mark an elimination criterion as missing or met again. */
export const CRITERION_UNMET_EVENT = "criterion_unmet";
export const CRITERION_MET_EVENT = "criterion_met";

/**
 * The class of one candidate. `missedCriteria`: the elimination criteria the recruiter marked as
 * missing (never guessed by Orbi). `strongPotential`: the « Fort potentiel » star, when known.
 */
export function classOf(input: {
  score: number;
  missedCriteria?: readonly string[];
  strongPotential?: boolean;
}): OrbiClass {
  if ((input.missedCriteria?.length ?? 0) > 0) return "hors";
  if (input.score >= CLASS_STRONG || input.strongPotential) return "fort";
  if (input.score >= CLASS_CONSIDER) return "considerer";
  return "limite";
}

/**
 * The criteria still marked as missing, from the events of an application (oldest first): the
 * last mark of each label wins.
 */
export function missedCriteriaOf(
  events: readonly { type: string; payload: unknown }[],
  criteria: readonly string[],
): string[] {
  const state = new Map<string, boolean>();
  for (const event of events) {
    if (event.type !== CRITERION_UNMET_EVENT && event.type !== CRITERION_MET_EVENT) continue;
    const label =
      event.payload && typeof event.payload === "object" && "label" in event.payload
        ? (event.payload as { label: unknown }).label
        : null;
    if (typeof label !== "string" || !criteria.includes(label)) continue;
    state.set(label, event.type === CRITERION_UNMET_EVENT);
  }
  return criteria.filter((label) => state.get(label) === true);
}

/** How many candidates fall in each class, in display order. */
export function classCounts<T extends { orbiClass: OrbiClass | null }>(rows: readonly T[]) {
  return orbiClasses.map((key) => ({
    key,
    count: rows.filter((row) => row.orbiClass === key).length,
  }));
}

/**
 * Documents a candidate sent among those the offer asks (« 3 sur 3 »). The CV and the letter are
 * read from the application; a diploma from a joined attestation, a portfolio from a joined text.
 * When the offer asks nothing, the documents sent are counted on their own.
 */
export function documentsOf(input: {
  asked: readonly string[];
  hasCv: boolean;
  hasLetter: boolean;
  attachments: readonly { type: string }[];
}): { received: number; asked: number } {
  const present: Record<string, boolean> = {
    cv: input.hasCv,
    letter: input.hasLetter,
    diploma: input.attachments.some((item) => item.type === "certificate"),
    portfolio: input.attachments.some((item) => item.type === "document"),
  };
  if (input.asked.length === 0) {
    const sent = Number(input.hasCv) + Number(input.hasLetter) + input.attachments.length;
    return { received: sent, asked: sent };
  }
  return {
    received: input.asked.filter((kind) => present[kind]).length,
    asked: input.asked.length,
  };
}

/**
 * The order of the pipeline list and of the summaries (a swipe goes to the next one): by class
 * (Fort potentiel first, Hors critères last, then the files not classed yet), the order received
 * inside a class (by score).
 */
export function rankByClass<T extends { orbiClass: OrbiClass | null }>(rows: readonly T[]): T[] {
  const rank = (row: T) =>
    row.orbiClass ? orbiClasses.indexOf(row.orbiClass) : orbiClasses.length;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => rank(a.row) - rank(b.row) || a.index - b.index)
    .map((item) => item.row);
}
