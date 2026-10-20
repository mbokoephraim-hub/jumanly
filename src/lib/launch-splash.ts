/**
 * Opening of the installed app (Ephraïm, 20/10): the animated Jumanly logo shows the instant the
 * app opens, for 3.5 s, then the space. The page loads behind it, so the space is ready when it
 * fades out.
 *
 * The splash is drawn by an inline script at the top of the page, before the first paint and
 * outside React: it stays up while the opening page hands over to the space (soft navigation).
 * It plays on the opening page (`/demarrage`, start of the installed app), and on the first page of
 * an installed app that still opens on an older address; once per app session. In a browser tab,
 * nothing shows.
 */
export const LAUNCH_PATH = "/demarrage";
export const LAUNCH_MS = 3500;
/** In reduced motion, the logo shows still, briefly. */
export const LAUNCH_REDUCED_MS = 1200;
const SEEN_KEY = "jm-lance";

const LOGO = `<svg class="jl-logo" viewBox="0 0 120 120" aria-hidden="true"><rect class="jl-carre" width="120" height="120" rx="30"/><g transform="translate(2.25 -4.35) scale(1.1)"><path class="jl-j" d="M70 55 V70 A19 19 0 0 1 33.15 76.50" pathLength="100"/><circle class="jl-point" cx="70" cy="31" r="11.5"/></g></svg>`;

/** The script, with the brand name for screen readers and the wordmark. */
export function launchScript(brand: string) {
  const html = `<span class="jl-marque"><span class="jl-halo" aria-hidden="true"></span>${LOGO}</span><span class="jl-nom" aria-hidden="true">${brand.toLowerCase()}<i>.</i></span>`;
  return `(function(){try{var d=document,p=location.pathname,s=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;if(p!==${JSON.stringify(LAUNCH_PATH)}&&(!s||sessionStorage.getItem(${JSON.stringify(SEEN_KEY)})))return;sessionStorage.setItem(${JSON.stringify(SEEN_KEY)},"1");var r=window.matchMedia("(prefers-reduced-motion: reduce)").matches,e=d.createElement("div");e.id="jm-lancement";e.setAttribute("role","status");e.setAttribute("aria-label",${JSON.stringify(brand)});e.innerHTML=${JSON.stringify(html)};d.documentElement.appendChild(e);setTimeout(function(){e.classList.add("jl-fin");setTimeout(function(){e.remove()},320)},r?${LAUNCH_REDUCED_MS}:${LAUNCH_MS - 300})}catch(x){}})();`;
}
