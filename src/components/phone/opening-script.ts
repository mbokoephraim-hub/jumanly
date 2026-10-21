import { LOGO_SVG, WORDMARK_SVG } from "./icon";

export const OPENING_ID = "nb-ouverture";
const SEEN_KEY = "jm-ouvert";
/** The logo alone (planche Application, décision d'Ephraïm): no bar, no icon, no text. */
export const OPENING_MS = 1200;
export const FADE_MS = 420;
/** If the page never becomes interactive, the logo still leaves. */
const GIVE_UP_MS = 8000;

/**
 * Drawn before the first paint, once per session of the app: the logo on Nuit. Behind it, the five
 * tabs, their images and fonts load; it fades out on the Fil already shown. Skipped when the opening
 * of the installed app (`#jm-lancement`) is already up.
 */
export const OPENING_HTML = `<span class="nb-logo">${LOGO_SVG}${WORDMARK_SVG}</span>`;
export const OPENING_SEEN_KEY = SEEN_KEY;

export function openingScript(brand: string) {
  const html = OPENING_HTML;
  return `(function(){try{var d=document;if(sessionStorage.getItem(${JSON.stringify(SEEN_KEY)})||d.getElementById("jm-lancement"))return;sessionStorage.setItem(${JSON.stringify(SEEN_KEY)},"1");var e=d.createElement("div");e.id=${JSON.stringify(OPENING_ID)};e.setAttribute("role","status");e.setAttribute("aria-label",${JSON.stringify(brand)});e.innerHTML=${JSON.stringify(html)};e.dataset.debut=String(Date.now());d.documentElement.appendChild(e);setTimeout(function(){if(e.isConnected){e.classList.add("nb-part");setTimeout(function(){e.remove()},${FADE_MS})}},${GIVE_UP_MS})}catch(x){}})();`;
}
