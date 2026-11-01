/**
 * Orbi's three notes (« JUMANLY Hire, logique du recrutement », le classement Orbi, Ephraïm
 * 01/11/2026): a promising junior and an experienced senior do not compare on one number.
 * - Compatibilité: the deterministic match score of partie 08 (computed elsewhere), which sets the
 *   class.
 * - Potentiel: the trajectory, from recent trainings, the progression between jobs and proven
 *   skills. Shown as the « Fort potentiel » star on a less compatible candidate who progresses.
 * - Confiance: the share of the information that is proven (document, referent, verification); it
 *   rises during the verification of the retained.
 *
 * Pure and deterministic. Never read: name, gender, age or date of birth, photo, nationality,
 * origin, religion, family, health, disability, precise address (golden rule n° 4). The years used
 * are those of trainings and jobs, never of the person.
 */

const YEAR = 365.25 * 86_400_000;

/** The star from this potential, for a candidate below « Fort potentiel » on compatibility. */
export const POTENTIAL_STAR = 70;

const RESPONSIBILITY =
  /\b(senior|lead|principal|chef|cheffe|responsable|manager|directeur|directrice|head|superviseur|superviseure|coordinat\w*)\b/i;

export type PotentialInput = {
  experiences: { title: string; startDate: Date; endDate: Date | null }[];
  /** Attestations of Jumanly and certificates of the profile, with their date. */
  trainings: { at: Date }[];
  skills: { proven: boolean }[];
};

export type Potential = {
  value: number;
  /** What raised it, for the « Pourquoi ? » (keys of the texts). */
  reasons: ("training" | "progression" | "proofs")[];
};

/** Potentiel (0 to 100): recent trainings 40, progression between jobs 30, proven skills 30. */
export function potentialOf(input: PotentialInput, now = new Date()): Potential {
  const recent = input.trainings.filter((item) => now.getTime() - item.at.getTime() <= YEAR);
  const training = Math.min(1, recent.length / 2);
  const jobs = [...input.experiences].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const latest = jobs.at(-1);
  const earlier = jobs.slice(0, -1);
  const steppedUp =
    latest !== undefined &&
    RESPONSIBILITY.test(latest.title) &&
    earlier.some((item) => !RESPONSIBILITY.test(item.title));
  const recentMoves = jobs.filter(
    (item) => now.getTime() - item.startDate.getTime() <= 4 * YEAR,
  ).length;
  const progression = steppedUp ? 1 : recentMoves >= 2 ? 0.5 : 0;
  const proven = input.skills.filter((item) => item.proven).length;
  const proofs = input.skills.length ? proven / input.skills.length : 0;
  const reasons: Potential["reasons"] = [];
  if (training >= 0.5) reasons.push("training");
  if (progression >= 0.5) reasons.push("progression");
  if (proofs >= 0.5) reasons.push("proofs");
  return {
    value: Math.round(training * 40 + progression * 30 + proofs * 30),
    reasons,
  };
}

/** The star: strong potential on a candidate the compatibility alone would not put first. */
export const strongPotential = (potential: number, score: number | null, strong = 75) =>
  potential >= POTENTIAL_STAR && (score ?? 0) < strong;

export type ConfidenceInput = {
  skills: { proven: boolean }[];
  /** Experiences and diplomas, `confirmed` when a referent confirmed them. */
  items: { confirmed: boolean }[];
  /** Pieces asked by the company (verification), `received` once dropped. */
  pieces: { received: boolean; required: boolean }[];
};

export type ConfidenceLevel = "low" | "medium" | "high";

export const confidenceLevel = (value: number): ConfidenceLevel =>
  value >= 70 ? "high" : value >= 40 ? "medium" : "low";

/**
 * Confiance (0 to 100): proven facts over facts declared. Each skill, each experience or diploma
 * and each piece asked counts once; a piece received or a referent's confirmation proves it.
 */
export function confidenceOf(input: ConfidenceInput) {
  const facts = [
    ...input.skills.map((item) => item.proven),
    ...input.items.map((item) => item.confirmed),
    ...input.pieces.filter((item) => item.required || item.received).map((item) => item.received),
  ];
  const value = facts.length ? Math.round((facts.filter(Boolean).length / facts.length) * 100) : 0;
  return { value, level: confidenceLevel(value) };
}

/** Before and after the verification: the same profile without the pieces received. */
export function confidenceChange(input: ConfidenceInput) {
  const before = confidenceOf({ ...input, pieces: [] });
  const after = confidenceOf(input);
  return { before, after, changed: input.pieces.some((item) => item.received) };
}
