/** Appearance of the talent space (brief § 2.10), shared by the server shell and the browser. */
export type Appearance = "auto" | "light" | "dark";

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Pages already redrawn after the planches (docs/refonte-mobile, lot by lot): only they take the
 * dark mode, so a page still in the former design is never shown half dark and unreadable, and
 * only they sit in the narrow column on a computer (the former contents keep their width, marked
 * `t-ancien` on <html>). The list grows with each lot; lot 7 removes it once every page is redrawn.
 */
export const REDRAWN = [
  "/app/orbi",
  "/app/bienvenue",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser",
];

export function redrawn(pathname: string) {
  return REDRAWN.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Script run before the first paint (inline, in the shell): puts `sombre` on <html> at once, so a
 * dark phone never flashes the light page (and a former page never jumps from the narrow column). Kept short: it runs on every full page load.
 */
export function appearanceScript(appearance: Appearance) {
  return `(function(){var a=${JSON.stringify(appearance)},r=${JSON.stringify(REDRAWN)},p=location.pathname;var ok=r.some(function(x){return p===x||p.indexOf(x+"/")===0});var d=ok&&(a==="dark"||(a==="auto"&&window.matchMedia("${DARK_QUERY}").matches));var c=document.documentElement.classList;c.toggle("sombre",d);c.toggle("t-ancien",!ok)})()`;
}
