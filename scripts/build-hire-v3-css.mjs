/**
 * Jumanly Hire v3 (docs/mvp-web-recruteur/prototype-v3, BRIEF-PROTOTYPE-V3.md § « Comment reprendre
 * le code »): the prototype's style sheet, prefixed ONCE under `.hv3`, no value changed.
 *
 *   node scripts/build-hire-v3-css.mjs   →   src/styles/hire-v3.css
 *
 * - Every selector goes under `:where(.hv3)`: the specificity stays the prototype's, so its rules
 *   win and lose exactly as in the prototype.
 * - `:root`, `html`, `body` (and `html,body`) become `.hv3`; `html[data-theme=dark]` becomes
 *   `html[data-theme=dark] .hv3`; the scrollbar of the page (`html{scrollbar-width}`) stays on
 *   `<html>` while a recruiter page is shown (`html:has(.hv3)`).
 * - The animations are renamed `hv3-…` (keyframes are global: the app has its own `fade`, `pop`…).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcss = require(require.resolve("postcss", { paths: [require.resolve("next")] }));

const SOURCE = "docs/mvp-web-recruteur/prototype-v3/code/hire-v3.css";
const TARGET = "src/styles/hire-v3.css";
const ROOT = ":where(.hv3)";
const DARK = "html[data-theme=dark]";

function prefix(selector) {
  const s = selector.trim();
  if (s === ":root" || s === "html" || s === "body") return ROOT;
  if (s.startsWith(DARK)) {
    const rest = s.slice(DARK.length).trim();
    if (rest === "" || rest === "body") return `${DARK} ${ROOT}`;
    if (rest.startsWith("body ")) return `${DARK} ${ROOT} ${rest.slice(5)}`;
    return `${DARK} ${ROOT} ${rest}`;
  }
  if (/^html(?=[:[.]|::)/.test(s)) return `html:has(.hv3)${s.slice(4)}`;
  if (/^body(?=[\s.:[>])/.test(s)) return `${ROOT}${s.slice(4)}`;
  return `${ROOT} ${s}`;
}

const css = readFileSync(SOURCE, "utf8");
const root = postcss.parse(css);
const names = new Set();
root.walkAtRules(/keyframes$/, (rule) => names.add(rule.params.trim()));
root.walkAtRules(/keyframes$/, (rule) => {
  rule.params = `hv3-${rule.params.trim()}`;
});
root.walkRules((rule) => {
  if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
  rule.selectors = [...new Set(rule.selectors.map(prefix))];
});
const word = new RegExp(`(^|[\\s,])(${[...names].join("|")})(?=$|[\\s,;])`, "g");
root.walkDecls(/^animation(-name)?$/, (decl) => {
  decl.value = decl.value.replace(word, (_, before, name) => `${before}hv3-${name}`);
});

writeFileSync(
  TARGET,
  `/* Généré par scripts/build-hire-v3-css.mjs depuis ${SOURCE} : ne pas modifier à la main. */\n${root.toString()}`,
);
console.log(`${TARGET} : ${names.size} animations renommées.`);
