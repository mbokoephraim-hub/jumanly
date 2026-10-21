/**
 * Opens Orbi's sheet from a page of the phone (Modèle B): the card « 3 offres publiées ce matin »
 * of the Fil, a question of a tab. The sheet (`PhoneOrbi`) listens for this event.
 */
export const ORBI_EVENT = "nb:orbi";

/** Answers Orbi gives from the facts of the platform, without a credit (lot B3). */
export const ORBI_FACTS = ["digest", "offres", "entreprises", "suivre", "ecrire"] as const;
export type OrbiFact = (typeof ORBI_FACTS)[number];

export function askOrbiFrom(fact: OrbiFact) {
  window.dispatchEvent(new CustomEvent<OrbiFact>(ORBI_EVENT, { detail: fact }));
}
