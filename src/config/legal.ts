/**
 * Values injected in the legal pages (textes, partie 10). The grace period is provisional
 * (partie 05): it moves to the subscription settings at step E9.
 */
export const legalValues = {
  lastUpdated: new Date("2026-10-13T00:00:00Z"),
  graceDays: 3,
};

/** Cookies actually set by the site, listed in the cookie policy table (key under `cookiesTable`). */
export const siteCookies = ["consent"] as const;
