/**
 * Generates `messages/fr.json` from the `| Clé | Texte |` tables in `textes/*.md`.
 *
 *   pnpm messages          regenerate the file
 *   pnpm messages:check    fail if the file is out of date (CI, build)
 *
 * Also writes `messages/fr.systeme.json`: the few texts of the 500 page, which must show even when
 * the rest of the application does not load (`global-error.tsx`, mockup 08-03), without bundling
 * every text of the site.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { buildMessages, extractEntries, isTextFile } from "./lib/texts";

const root = join(import.meta.dirname, "..");
const textsDir = join(root, "textes");
const output = join(root, "messages", "fr.json");
const systemOutput = join(root, "messages", "fr.systeme.json");
const checkOnly = process.argv.includes("--check");

const files = readdirSync(textsDir).filter(isTextFile).sort();
const entries = files.flatMap((name) => {
  const path = join(textsDir, name);
  return extractEntries(readFileSync(path, "utf8"), relative(root, path));
});

const { messages, errors } = buildMessages(entries);

if (errors.length > 0) {
  console.error(`✗ ${errors.length} erreur(s) dans textes/ :`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const json = `${JSON.stringify(messages, null, 2)}\n`;
type Tree = { [key: string]: string | Tree };
const tree = messages as Tree;
const branch = (node: Tree, key: string) => node[key] as Tree;
const systemJson = `${JSON.stringify(
  {
    common: { brand: branch(tree, "common").brand },
    system: {
      500: branch(branch(tree, "system"), "500"),
      error: { reference: branch(branch(tree, "system"), "error").reference },
    },
  },
  null,
  2,
)}\n`;

if (checkOnly) {
  const current = existsSync(output) ? readFileSync(output, "utf8") : "";
  const currentSystem = existsSync(systemOutput) ? readFileSync(systemOutput, "utf8") : "";
  if (current !== json || currentSystem !== systemJson) {
    console.error("✗ messages/fr.json n'est pas à jour. Lancez « pnpm messages ».");
    process.exit(1);
  }
  console.log(`✓ messages/fr.json à jour (${entries.length} textes).`);
} else {
  writeFileSync(output, json);
  writeFileSync(systemOutput, systemJson);
  console.log(`✓ messages/fr.json généré : ${entries.length} textes, ${files.length} fichier(s).`);
}
