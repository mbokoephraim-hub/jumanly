/** The night of the Modèle B (phone.css `--nb-nuit`): the colour of the whole phone screen. */
export const PHONE_NIGHT = "#0b1a1f";

/**
 * Before the first paint, the browser bar (and the status bar of the installed app) takes the
 * night of the Modèle B, so the dark background covers the screen from top to bottom.
 */
export function phoneThemeScript() {
  return `document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content","${PHONE_NIGHT}")})`;
}
