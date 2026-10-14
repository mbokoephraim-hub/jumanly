import academic from "../../../docs/modeles-cv/modeles/donnees/exemple-academique.json";
import junior from "../../../docs/modeles-cv/modeles/donnees/exemple-junior.json";
import senior from "../../../docs/modeles-cv/modeles/donnees/exemple-senior.json";
import type { ExampleCv } from "./render/build";

/**
 * The three demonstration CVs of the reference PDFs (manifestly fictitious): the gallery shows
 * them while a CV is empty (§ 8.4), and the visual tests compare the templates with them.
 */
export const cvExamples = {
  junior: junior as ExampleCv,
  senior: senior as ExampleCv,
  academique: academic as ExampleCv,
} as const;

export type CvExampleId = keyof typeof cvExamples;

/** Message key of a template id (« premier-emploi » → « premierEmploi »). */
export function templateKey(id: string) {
  return id.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
}
