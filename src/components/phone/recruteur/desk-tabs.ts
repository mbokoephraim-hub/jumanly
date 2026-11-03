import { DESK_RUBRIQUES, type DeskRubrique } from "@/server/services/hire-desk";

/** The address of each part of an offer on the phone (03/11/2026, step 2). */
export const deskTabHref = (jobId: string, tab: DeskRubrique | "apercu") =>
  `/app/hire/offres/${jobId}?vue=${tab}`;

/**
 * The rubrique a `vue` names. The older names still open: « candidatures » (and no `vue`) is
 * « À trier », « retenus » is « Entretiens ».
 */
export function deskTabOf(vue: string | undefined): DeskRubrique {
  if (vue === "retenus") return "entretiens";
  return DESK_RUBRIQUES.find((key) => key === vue) ?? "trier";
}

/** The `de` of a candidate's file opened from a rubrique; « candidatures » was « À trier ». */
export function fromTabOf(de: string | undefined): DeskRubrique | null {
  if (de === "candidatures") return "trier";
  return DESK_RUBRIQUES.find((key) => key === de) ?? null;
}
