/** Appearance of the talent space (brief § 2.10), shared by the server shell and the browser. */
export type Appearance = "auto" | "light" | "dark";

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Script run before the first paint (inline, in the shell): puts `sombre` on <html> at once, so a
 * dark phone never flashes the light page. Every page of the talent space is redrawn (lot 7): all
 * of them take the dark mode. Kept short: it runs on every full page load.
 */
export function appearanceScript(appearance: Appearance) {
  return `(function(){var a=${JSON.stringify(appearance)};var d=a==="dark"||(a==="auto"&&window.matchMedia("${DARK_QUERY}").matches);document.documentElement.classList.toggle("sombre",d)})()`;
}
