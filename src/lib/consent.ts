/**
 * Cookie consent (textes, « Bandeau cookies »; docs/specifications.md, partie 10). Necessary
 * cookies are always on; analytics and preferences need an explicit choice. Stored for 6 months.
 */
export const CONSENT_COOKIE = "jm_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;

export type Consent = { analytics: boolean; preferences: boolean };

export function serializeConsent(consent: Consent): string {
  return `v1.a${consent.analytics ? 1 : 0}.p${consent.preferences ? 1 : 0}`;
}

export function parseConsent(value: string | undefined): Consent | null {
  const match = value?.match(/^v1\.a([01])\.p([01])$/);
  return match ? { analytics: match[1] === "1", preferences: match[2] === "1" } : null;
}

export function readConsentCookie(cookieHeader: string): Consent | null {
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(entry?.slice(CONSENT_COOKIE.length + 1));
}

/** Event that reopens the cookie settings (footer link "Gérer les cookies"). */
export const OPEN_COOKIE_SETTINGS = "jm:cookie-settings";
