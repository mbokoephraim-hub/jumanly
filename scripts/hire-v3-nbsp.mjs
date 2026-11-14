// Espaces insécables dans les textes de Jumanly Hire v3 (clés `hireV3…`) : avant « % », « : »,
// « ? », « ! », « » » et après « « ». Usage : node scripts/hire-v3-nbsp.mjs (puis pnpm messages).
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "textes/textes-application.md";
const NB = " ";
let changed = 0;
const out = readFileSync(FILE, "utf8")
  .split("\n")
  .map((line) => {
    const m = /^(\| `hireV3[A-Za-z]*\.[^`]+` \| )(.*)( \|)$/.exec(line);
    if (!m) return line;
    const text = m[2].replace(/ ([%:?!»])/g, `${NB}$1`).replace(/« /g, `«${NB}`);
    if (text !== m[2]) changed++;
    return m[1] + text + m[3];
  })
  .join("\n");
writeFileSync(FILE, out);
console.log(`${changed} texte(s) corrigé(s)`);
