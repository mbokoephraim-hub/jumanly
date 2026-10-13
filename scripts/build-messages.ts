/**
 * Génère `messages/fr.json` à partir des tableaux `| Clé | Texte |` de `textes/*.md`.
 *
 *   pnpm messages          régénère le fichier
 *   pnpm messages:check    échoue si le fichier n'est pas à jour (utilisé en CI)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { construireMessages, extraireEntrees } from "./lib/textes";

const racine = join(import.meta.dirname, "..");
const dossierTextes = join(racine, "textes");
const sortie = join(racine, "messages", "fr.json");
const verification = process.argv.includes("--check");

const fichiers = readdirSync(dossierTextes)
  .filter((nom) => nom.endsWith(".md") && nom.toLowerCase() !== "lisezmoi.md")
  .sort();

const entrees = fichiers.flatMap((nom) => {
  const chemin = join(dossierTextes, nom);
  return extraireEntrees(readFileSync(chemin, "utf8"), relative(racine, chemin));
});

const { messages, erreurs } = construireMessages(entrees);

if (erreurs.length > 0) {
  console.error(`✗ ${erreurs.length} erreur(s) dans textes/ :`);
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  process.exit(1);
}

const json = `${JSON.stringify(messages, null, 2)}\n`;

if (verification) {
  const actuel = existsSync(sortie) ? readFileSync(sortie, "utf8") : "";
  if (actuel !== json) {
    console.error("✗ messages/fr.json n'est pas à jour. Lancez « pnpm messages ».");
    process.exit(1);
  }
  console.log(`✓ messages/fr.json à jour (${entrees.length} textes).`);
} else {
  writeFileSync(sortie, json);
  console.log(
    `✓ messages/fr.json généré : ${entrees.length} textes depuis ${fichiers.length} fichier(s).`,
  );
}
