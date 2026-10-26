/**
 * The names of the recruiter's pages on a computer (Modèle B, lot N1, Web-App `TITRES`). A plain
 * module: the shell (server) lists the keys, the head (client) picks one by address.
 */
export const RB_TITLES = [
  "home",
  "fil",
  "offers",
  "publish",
  "applications",
  "evaluation",
  "agenda",
  "talents",
  "messages",
  "notifications",
  "orbi",
  "dashboard",
  "mine",
  "account",
  "settings",
  "companies",
  "team",
  "page",
  "billing",
  "journal",
  "recruiting",
  "models",
] as const;
export type TitleKey = (typeof RB_TITLES)[number];

/** The name of each page (Web-App `TITRES`): the longest path that contains the address. */
const TITLE_PATHS: [string, TitleKey][] = [
  ["/app/hire", "home"],
  ["/app/fil", "fil"],
  ["/app/hire/fil", "fil"],
  ["/app/hire/offres", "offers"],
  ["/app/hire/offres/nouvelle", "publish"],
  ["/app/hire/candidats", "applications"],
  ["/app/hire/entretiens", "agenda"],
  ["/app/hire/talents", "talents"],
  ["/app/hire/viviers", "talents"],
  ["/app/messages", "messages"],
  ["/app/notifications", "notifications"],
  ["/app/orbi", "orbi"],
  ["/app/hire/rapports", "dashboard"],
  ["/app/hire/taches", "mine"],
  ["/app/hire/compte", "account"],
  ["/app/hire/modeles", "models"],
  ["/app/parametres", "settings"],
  ["/app/entreprises", "companies"],
  ["/app/organisation", "page"],
  ["/app/organisation/equipe", "team"],
  ["/app/organisation/structure", "team"],
  ["/app/organisation/facturation", "billing"],
  ["/app/organisation/journal", "journal"],
  ["/app/organisation/reglages", "recruiting"],
];

export function recruiterTitleOf(pathname: string): TitleKey {
  if (/^\/app\/hire\/candidats\/[^/]+\/evaluation$/.test(pathname)) return "evaluation";
  let best: [string, TitleKey] = ["", "home"];
  for (const entry of TITLE_PATHS) {
    const [path] = entry;
    const within = pathname === path || pathname.startsWith(`${path}/`);
    if (within && path.length > best[0].length) best = entry;
  }
  return best[1];
}
