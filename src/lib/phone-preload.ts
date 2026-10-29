/**
 * Preloading on the phone (Ephraïm's request of 22/10/2026): the pages one can open from the
 * screen are loaded in the background, so that a tap shows them at once. This file says which
 * addresses may be loaded that way: never a file (PDF, Word, calendar), never a page whose opening
 * leaves a trace (a conversation read, a profile looked at).
 */

/** Files served by the signed-in space (route handlers under src/app/app), never preloaded. */
const FILES = [
  /^\/app\/jobs\/candidatures\/[^/]+\/cv$/,
  /^\/app\/abonnement\/factures\/[^/]+\/pdf$/,
  /^\/app\/suivi\/entretiens\/[^/]+\/agenda$/,
  /^\/app\/parametres\/export$/,
  /^\/app\/career\/plan\/rapport$/,
  /^\/app\/career\/diagnostic\/pdf$/,
  /^\/app\/career\/cv\/[^/]+\/(word|pdf|fichier)$/,
  /^\/app\/career\/documents\/[^/]+\/pdf$/,
  /^\/app\/learn\/attestations\/[^/]+\/[^/]+$/,
  /^\/app\/learn\/[^/]+\/(support|modele-attestation)$/,
  /^\/app\/hire\/rapports\/export$/,
  /^\/app\/hire\/entretiens\/[^/]+\/agenda$/,
  /^\/app\/appels$/,
];

/**
 * Pages whose opening is recorded: a conversation is marked as read, a recruiter's look at a
 * profile is logged (CLAUDE.md § 5). Also the spaces of an institution and of the administration.
 */
const RECORDED = [
  /^\/app\/messages\/(?!(demandes|connexions)$)[^/]+(\/.*)?$/,
  // The recruiter's phone (Modèle B recruteur): its lists load ahead, never a candidate's file,
  // a talent's profile or an application opened from the ATS.
  /^\/app\/hire\/candidats\/[^/]+(\/.*)?$/,
  /^\/app\/hire\/talents\/[^/]+(\/.*)?$/,
  /^\/app\/hire\/offres\/[^/]+\/ats\/[^/]+(\/.*)?$/,
  /^\/app\/(partenaire|organisation)(\/|$)/,
  // A person's profile and a post count a visit and a view (Mon profil › Statistiques).
  /^\/app\/personnes\/[^/]+$/,
  /^\/app\/fil\/(?!(publier|mes-publications)$)[^/]+$/,
];

/**
 * Pages that change while one looks at them (what others send, the answers of recruiters, a
 * form being filled): always asked for at the tap, never shown from a copy loaded earlier.
 */
const LIVE = [
  /^\/app\/(notifications|messages)(\/|$)/,
  /^\/app\/suivi(\/|$)/,
  /^\/app\/jobs\/candidatures(\/|$)/,
  /\/postuler$/,
];

/** At most this many pages are preloaded after a screen appears. */
export const PRELOAD_MAX = 40;

/**
 * The path to preload for a link of the phone, or null. `href` is the link's address as written,
 * `current` the path of the screen shown.
 */
export function preloadPath(href: string, current: string): string | null {
  let url: URL;
  try {
    url = new URL(href, "https://jumanly.io");
  } catch {
    return null;
  }
  if (url.origin !== "https://jumanly.io") return null;
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (path !== "/app" && !path.startsWith("/app/")) return null;
  if (path === current) return null;
  if (FILES.some((pattern) => pattern.test(path))) return null;
  if (RECORDED.some((pattern) => pattern.test(path))) return null;
  if (LIVE.some((pattern) => pattern.test(path))) return null;
  if (url.searchParams.has("postuler")) return null;
  return `${path}${url.search}`;
}

/** Slow or counted connections (« Économiseur de données », 2G): nothing is preloaded. */
export function preloadAllowed(connection?: { saveData?: boolean; effectiveType?: string }) {
  if (!connection) return true;
  if (connection.saveData) return false;
  return !["slow-2g", "2g"].includes(connection.effectiveType ?? "");
}
