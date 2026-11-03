/**
 * « Évaluation » of a candidate (Ephraïm, 03/11/2026): Orbi gives its opinion and its reasons,
 * the recruiter decides. A fixed rule, the same for every candidate of the offer, read from the
 * class of the pipeline (hire-classes.ts) and from what is still to verify. It suggests, it never
 * decides: nothing moves until a member presses a button.
 */
import type { OrbiClass } from "./hire-classes";

export const evaluationSuggestions = ["retain", "hold", "reject"] as const;
export type EvaluationSuggestion = (typeof evaluationSuggestions)[number];

/** Why Orbi suggests it, in one sentence each (textes `phoneRhFiche.eval.why.*`). */
export type EvaluationWhy = "knockout" | "strong" | "verify" | "consider" | "limited";

export function suggestionOf(input: {
  orbiClass: OrbiClass | null;
  /** Unconfirmed experiences, diplomas without a copy, documents asked and not sent. */
  toVerify: number;
}): { suggestion: EvaluationSuggestion; why: EvaluationWhy } | null {
  switch (input.orbiClass) {
    case "hors":
      return { suggestion: "reject", why: "knockout" };
    case "fort":
      return input.toVerify > 0
        ? { suggestion: "hold", why: "verify" }
        : { suggestion: "retain", why: "strong" };
    case "considerer":
      return { suggestion: "hold", why: "consider" };
    case "limite":
      return { suggestion: "reject", why: "limited" };
    default:
      return null;
  }
}

/** The reasons a member picks when deciding (kept on the application, for the team only). */
export const retainReasons = ["skills", "experience", "potential", "proofs", "other"] as const;
export const holdReasons = ["verify", "compare", "interview", "documents", "other"] as const;
export type SortReason = (typeof retainReasons)[number] | (typeof holdReasons)[number];

/** Event that keeps the reason of « Retenir » or « En attente » (payload { gesture, reason }). */
export const SORT_REASON_EVENT = "sort_reason";
