/**
 * Opens Orbi's sheet from a page of the phone (Modèle B): the card « 3 offres publiées ce matin »
 * of the Fil, a question of a tab. The sheet (`PhoneOrbi`) listens for this event.
 */
export const ORBI_EVENT = "nb:orbi";

/** Answers Orbi gives from the facts of the platform, without a credit (lots B3, B7, B8). */
export const ORBI_FACTS = [
  "digest",
  "offres",
  "entreprises",
  "suivre",
  "ecrire",
  "cours",
  "nonlus",
  "prioritaire",
  "recruteur",
  "relire",
] as const;
export type OrbiFact = (typeof ORBI_FACTS)[number];

export function askOrbiFrom(fact: OrbiFact) {
  window.dispatchEvent(new CustomEvent<OrbiFact>(ORBI_EVENT, { detail: fact }));
}

/** A question for Orbi's conversation, asked from a page (« Préparer avec Orbi », lot B5). */
export const ORBI_ASK_EVENT = "nb:orbi-question";

export function askOrbi(question: string) {
  window.dispatchEvent(new CustomEvent<string>(ORBI_ASK_EVENT, { detail: question }));
}
