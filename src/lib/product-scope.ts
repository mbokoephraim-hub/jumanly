/**
 * Mode MVP (docs/mvp-web-recruteur, lot M0, décision d'Ephraïm du 12/11/2026). `PRODUCT_SCOPE=full`
 * (défaut, local) montre toute la plateforme ; `PRODUCT_SCOPE=hire` (production du MVP) ne montre que
 * l'outil de recrutement des entreprises : le reste est mis en veille, caché mais jamais supprimé
 * (code et données intacts). C'est la seule fonction qui lit la variable : aucun autre test dispersé.
 *
 * La variable est lue au build (redirections de `next.config.ts`, pages publiques statiques) et au
 * lancement du serveur : elle doit être la même aux deux moments.
 */
export type ProductScope = "full" | "hire";

export function productScope(): ProductScope {
  return process.env.PRODUCT_SCOPE === "hire" ? "hire" : "full";
}

export function isHireScope(scope: ProductScope = productScope()) {
  return scope === "hire";
}

/** Pages publiques mises en veille (Learn, talents, partenaires, attestations, portfolios). */
export const ASLEEP_PUBLIC = [
  "/formations",
  "/talents",
  "/partenaires",
  "/attestations",
  "/portfolio",
] as const;

/**
 * Espace connecté mis en veille : Fil, Explorer, Formation, Orbi conversation côté talent,
 * Partners, ancien tableau de bord. Un talent garde ses candidatures (`/app/suivi`,
 * `/app/jobs/candidatures`), ses messages et son profil ; la liste des offres passe par le site
 * (`/offres`, qui reste : ce sont les pages carrière).
 */
export const ASLEEP_APP = [
  "/app/fil",
  "/app/explorer",
  "/app/learn",
  "/app/orbi",
  "/app/partenaire",
  "/app/tableau-de-bord",
] as const;

/** Où mène une page en veille : le site pour une page publique, l'accueil du compte sinon. */
export function asleepTarget(path: string, scope: ProductScope = productScope()): string | null {
  if (!isHireScope(scope)) return null;
  const under = (prefix: string) => path === prefix || path.startsWith(`${prefix}/`);
  if (ASLEEP_PUBLIC.some(under)) return "/";
  if (ASLEEP_APP.some(under)) return "/app";
  if (path === "/app/jobs") return "/offres";
  return null;
}

/** Les redirections 307 de `next.config.ts` (rien en mode `full`). */
export function asleepRedirects(scope: ProductScope = productScope()) {
  if (!isHireScope(scope)) return [];
  return [
    ...ASLEEP_PUBLIC.flatMap((prefix) => [
      { source: prefix, destination: "/", permanent: false },
      { source: `${prefix}/:path*`, destination: "/", permanent: false },
    ]),
    ...ASLEEP_APP.flatMap((prefix) => [
      { source: prefix, destination: "/app", permanent: false },
      { source: `${prefix}/:path*`, destination: "/app", permanent: false },
    ]),
    { source: "/app/jobs", destination: "/offres", permanent: false },
  ];
}

/** Un lien du site (menu, pied de page, plan du site, llms.txt) qui mène à une page en veille. */
export function isAsleepHref(href: string, scope: ProductScope = productScope()) {
  const path = href.split(/[?#]/)[0] ?? href;
  return asleepTarget(path, scope) !== null;
}
