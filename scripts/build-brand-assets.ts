/**
 * Brand assets: ressources/ (files as provided) → what the app serves.
 * - Icons: ressources/icones/trait/*.svg (41 brand icons), then the interface icons of the mockups
 *   (docs/maquettes/ressources/icones-complementaires) and the few drawn for the app in the same
 *   grammar (ressources/icones/interface) → src/components/brand/icon-paths.ts (drawn with
 *   currentColor, so one set covers the Sapin, white and duo styles).
 * - Characters, patterns, shapes, backgrounds → public/ (SVG only).
 * - Talent icons of the mobile redesign: ressources/icones/talent → src/components/talent/icon-paths.ts.
 * - App icons (PWA manifest): ressources/logos/jumanly-favicon-{192,512}.png → public/marque/.
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

function write(path: string, content: string | Buffer) {
  const current = existsSync(path) ? readFileSync(path) : null;
  if (current?.equals(Buffer.from(content))) return;
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

// Icons: keep only the drawing. Brand icons wrap it in a stroke group; interface icons carry the
// stroke attributes on the <svg> element itself.
const ICON_GROUP =
  /<g fill="none" stroke="#0F3F37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">([\s\S]*?)<\/g>/;
const ICON_ROOT = /<svg[^>]*stroke="#0F3F37"[^>]*>([\s\S]*?)<\/svg>/;
const iconFolders = [
  "ressources/icones/trait",
  "docs/maquettes/ressources/icones-complementaires",
  "ressources/icones/interface",
];
const icons = iconFolders.flatMap((folder) =>
  svgFiles(folder).map((file) => {
    const svg = stripMetadata(readFileSync(join(root, folder, file), "utf8"));
    const match = ICON_GROUP.exec(svg) ?? ICON_ROOT.exec(svg);
    if (!match) throw new Error(`Icône au format inattendu : ${folder}/${file}`);
    return [basename(file, ".svg").replace(/^jm-/, ""), match[1].trim()] as const;
  }),
);
const duplicate = icons.find(
  ([name], index) => icons.findIndex(([other]) => other === name) !== index,
);
if (duplicate) throw new Error(`Icône en double : ${duplicate[0]}`);
write(
  join(root, "src/components/brand/icon-paths.ts"),
  `// Généré par scripts/build-brand-assets.ts depuis ${iconFolders.join(", ")}. Ne pas modifier.\n` +
    `export const iconPaths = {\n${icons.map(([name, body]) => `  ${JSON.stringify(name)}: ${JSON.stringify(body)},`).join("\n")}\n} as const;\n`,
);

// Talent space icons of the mobile redesign (docs/refonte-mobile, 1.8 px line): their own set, since
// several names match the brand icons with another drawing.
const TALENT_ICON = /<svg[^>]*>(?:<title>[^<]*<\/title>)?([\s\S]*?)<\/svg>/;
const talentFolder = "ressources/icones/talent";
const talentIcons = svgFiles(talentFolder).map((file) => {
  const match = TALENT_ICON.exec(readFileSync(join(root, talentFolder, file), "utf8"));
  if (!match) throw new Error(`Icône au format inattendu : ${talentFolder}/${file}`);
  return [basename(file, ".svg"), match[1].trim()] as const;
});
write(
  join(root, "src/components/talent/icon-paths.ts"),
  `// Généré par scripts/build-brand-assets.ts depuis ${talentFolder}. Ne pas modifier.\n` +
    `export const talentIconPaths = {\n${talentIcons.map(([name, body]) => `  ${JSON.stringify(name)}: ${JSON.stringify(body)},`).join("\n")}\n} as const;\n`,
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

// App icons, copied as they are.
for (const size of [192, 512]) {
  const file = `jumanly-favicon-${size}.png`;
  write(join(root, "public/marque", file), readFileSync(join(root, "ressources/logos", file)));
}

if (stale.length) {
  console.error(`✗ Ressources de marque à régénérer (pnpm brand) :\n  ${stale.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `✓ Ressources de marque ${check ? "à jour" : "générées"} : ${icons.length} icônes, ${talentIcons.length} icônes talent.`,
);
