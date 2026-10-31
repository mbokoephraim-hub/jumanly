/**
 * Réalisations clés of an experience (demande d'Ephraïm du 29/10/2026): each one is a line of the
 * experience's description, in the person's order. The profile shows them as points, the CV as
 * bullets; a description written before (a paragraph, « - » or « • » lines) reads the same way.
 */

/** How many points an experience holds: 3 to 4 is the advice, 8 at most. */
export const ACHIEVEMENTS_MAX = 8;
/** Length of one point. */
export const ACHIEVEMENT_MAX = 300;
/** Fields shown in the form of a new experience. */
export const ACHIEVEMENTS_SUGGESTED = 3;

/** The points of a description, without their bullet. */
export function achievementsOf(description: string): string[] {
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*·–]\s*/, "").trim())
    .filter(Boolean);
}

/** The description saved for a list of points: the empty ones are dropped. */
export function achievementsText(points: string[]): string {
  return points
    .map((point) => point.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** « Ce que j'ai appris » of a diploma or a certificate (demande d'Ephraïm du 31/10/2026): 2 to 3. */
export const LEARNINGS_MAX = 3;
/** Length of one learning point. */
export const LEARNING_MAX = 160;
