/**
 * Brand assets: ressources/ (files as provided) → what the app serves.
 * - Icons: ressources/icones/trait/*.svg → src/components/brand/icon-paths.ts (drawn with
 *   currentColor, so one set covers the Sapin, white and duo styles).
 * - Characters, patterns, shapes, backgrounds → public/ (SVG only).
 * Each source SVG carries a provenance manifest (<metadata>, about 7 KB); it is removed from the
 * copies served to visitors, not from ressources/.
 *
 * Usage: pnpm brand            (regenerate)
 *        pnpm brand --check    (fails if the generated files are out of date)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");
const stale: string[] = [];

function write(path: string, content: string) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === content) return;
  if (check) stale.push(path);
  else {
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content);
  }
}

function stripMetadata(svg: string) {
  return svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, "").replace(/ xmlns:c2pa="[^"]*"/, "");
}

function svgFiles(dir: string) {
  return readdirSync(join(root, dir))
    .filter((file) => file.endsWith(".svg"))
    .sort();
}

// Icons: keep only the drawing inside the stroke group.
const ICON_GROUP =
  /<g fill="none" stroke="#0F3F37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">([\s\S]*?)<\/g>/;
const icons = svgFiles("ressources/icones/trait").map((file) => {
  const svg = stripMetadata(readFileSync(join(root, "ressources/icones/trait", file), "utf8"));
  const match = ICON_GROUP.exec(svg);
  if (!match) throw new Error(`Icône au format inattendu : ${file}`);
  return [basename(file, ".svg").replace(/^jm-/, ""), match[1]] as const;
});
write(
  join(root, "src/components/brand/icon-paths.ts"),
  `// Généré par scripts/build-brand-assets.ts depuis ressources/icones/trait. Ne pas modifier.\n` +
    `export const iconPaths = {\n${icons.map(([name, body]) => `  ${JSON.stringify(name)}: ${JSON.stringify(body)},`).join("\n")}\n} as const;\n`,
);

// Images served as files.
const folders: [string, string][] = [
  ["ressources/illustrations/svg", "public/illustrations"],
  ["ressources/motifs", "public/marque/motifs"],
  ["ressources/formes", "public/marque/formes"],
  ["ressources/fonds", "public/marque/fonds"],
];
for (const [from, to] of folders) {
  for (const file of svgFiles(from)) {
    const svg = stripMetadata(readFileSync(join(root, from, file), "utf8"));
    write(join(root, to, file), svg.endsWith("\n") ? svg : `${svg}\n`);
  }
}

if (stale.length) {
  console.error(`✗ Ressources de marque à régénérer (pnpm brand) :\n  ${stale.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ Ressources de marque ${check ? "à jour" : "générées"} : ${icons.length} icônes.`);
