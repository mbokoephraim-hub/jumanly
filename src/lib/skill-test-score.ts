/**
 * The score of a skills test (Hire v3 « Tests », MVP M5), the same way for everyone: a choice
 * question is right or wrong; a written answer gets the points the team gave it. Out of 100, and
 * only once every written answer is graded (`null` before: « À corriger »). Nobody is set aside
 * by a score: it informs the team, which decides.
 */
export type ScoredQuestion = {
  id: string;
  kind: string;
  answer: number | null;
  points: number;
};

export function scoreAttempt(
  questions: ScoredQuestion[],
  answers: Record<string, unknown>,
  grades: Record<string, unknown>,
): { score: number | null; toGrade: number; perQuestion: Record<string, number | null> } {
  let total = 0;
  let earned = 0;
  let toGrade = 0;
  const perQuestion: Record<string, number | null> = {};
  for (const q of questions) {
    const points = Math.max(1, q.points);
    total += points;
    if (q.kind === "choice") {
      const right = q.answer !== null && answers[q.id] === q.answer;
      perQuestion[q.id] = right ? 1 : 0;
      if (right) earned += points;
      continue;
    }
    const given = grades[q.id];
    const written = typeof answers[q.id] === "string" && (answers[q.id] as string).trim() !== "";
    if (!written) {
      perQuestion[q.id] = 0;
      continue;
    }
    if (typeof given !== "number") {
      toGrade++;
      perQuestion[q.id] = null;
      continue;
    }
    const kept = Math.min(points, Math.max(0, given));
    perQuestion[q.id] = kept / points;
    earned += kept;
  }
  if (total === 0) return { score: null, toGrade, perQuestion };
  return { score: toGrade > 0 ? null : Math.round((earned / total) * 100), toGrade, perQuestion };
}

/** The five bars of « Répartition des scores » (0-20 … 80-100). */
export function scoreBuckets(scores: number[]) {
  const buckets = [0, 0, 0, 0, 0];
  for (const s of scores) buckets[Math.min(4, Math.floor(Math.max(0, s) / 20))]!++;
  return buckets;
}

export function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}
