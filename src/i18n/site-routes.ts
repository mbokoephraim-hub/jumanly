/** Cookie holding the visitor's language, read by the rewrites below (no import: next.config). */
export const LOCALE_COOKIE = "jm_langue";

/** Languages of the public site: French is the reference, English is laid over it. */
export const siteLocales = ["fr", "en"] as const;

/**
 * Addresses of the public site (src/app/[locale]/(public)). They keep their French address
 * (`/tarifs`) in both languages: a rewrite serves `/fr/tarifs` or `/en/tarifs` depending on the
 * `jm_langue` cookie, so each language stays a static page and no link has to change.
 * Certificate checks (`/attestations/CODE`) and the signed-in space are not concerned.
 */
export const publicSitePaths = [
  "/",
  "/a-propos",
  "/attestations",
  "/comment-fonctionne-le-matching",
  "/conditions",
  "/confidentialite",
  "/contact",
  "/cookies",
  "/entreprises/:path*",
  "/faq",
  "/liste-attente",
  "/formations/:path*",
  "/mentions-legales",
  "/offres/:path*",
  "/partenaires",
  "/portfolio/:path*",
  "/recruteurs",
  "/talents",
  "/tarifs",
] as const;

type Rewrite = {
  source: string;
  destination: string;
  has?: { type: "cookie"; key: string; value: string }[];
};

export function publicSiteRewrites(): Rewrite[] {
  const english = { type: "cookie", key: LOCALE_COOKIE, value: "en" } as const;
  return publicSitePaths.flatMap((source) => {
    const target = source === "/" ? "" : source;
    return [
      { source, has: [english], destination: `/en${target}` },
      { source, destination: `/fr${target}` },
    ];
  });
}
