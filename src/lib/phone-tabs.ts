/**
 * The five tabs of the phone interface (Modèle B, brief § 3), in the order of the bar, and the
 * pages that belong to each. Two sets: the talent's (Fil · Explorer · Carrière · Formation ·
 * Messages, docs/modele-b) and the recruiter's (Fil · Offres · Candidatures · Talents · Messages,
 * docs/modele-b-recruteur).
 */
export const PHONE_TABS = ["fil", "explorer", "carriere", "formation", "messages"] as const;
export const RECRUITER_TABS = ["fil", "offres", "candidatures", "talents", "messages"] as const;
export type TalentTab = (typeof PHONE_TABS)[number];
export type RecruiterTab = (typeof RECRUITER_TABS)[number];
export type PhoneTab = TalentTab | RecruiterTab;
export type TabSetName = "talent" | "recruteur";

type TabSet = {
  tabs: readonly PhoneTab[];
  roots: Partial<Record<PhoneTab, string>>;
  prefixes: [string, PhoneTab][];
  /** Pages opened from a tab that keep the bottom bar and Orbi (planches Entreprise, Personne). */
  barPages: string[];
};

export const TAB_ROOTS: Record<TalentTab, string> = {
  fil: "/app",
  explorer: "/app/jobs",
  carriere: "/app/career/cv",
  formation: "/app/learn",
  messages: "/app/messages",
};

/** The recruiter's tabs (M0 diagnostic, docs/journal.md): the web keeps its own addresses. */
export const RECRUITER_ROOTS: Record<RecruiterTab, string> = {
  fil: "/app/hire",
  offres: "/app/hire/offres",
  candidatures: "/app/hire/candidats",
  talents: "/app/hire/talents",
  messages: "/app/messages",
};

const SETS: Record<TabSetName, TabSet> = {
  talent: {
    tabs: PHONE_TABS,
    roots: TAB_ROOTS,
    prefixes: [
      ["/app/jobs", "explorer"],
      ["/app/explorer", "explorer"],
      ["/app/recherche", "explorer"],
      ["/app/entreprises", "explorer"],
      ["/app/personnes", "explorer"],
      ["/app/career", "carriere"],
      ["/app/profil", "carriere"],
      ["/app/suivi", "carriere"],
      ["/app/compte", "carriere"],
      ["/app/abonnement", "carriere"],
      ["/app/parametres", "carriere"],
      ["/app/learn", "formation"],
      ["/app/messages", "messages"],
    ],
    barPages: ["/app/entreprises/", "/app/personnes/"],
  },
  recruteur: {
    tabs: RECRUITER_TABS,
    roots: RECRUITER_ROOTS,
    prefixes: [
      ["/app/hire/offres", "offres"],
      ["/app/hire/candidats", "candidatures"],
      ["/app/hire/entretiens", "candidatures"],
      ["/app/hire/talents", "talents"],
      ["/app/hire/viviers", "talents"],
      ["/app/messages", "messages"],
    ],
    barPages: ["/app/entreprises/", "/app/personnes/"],
  },
};

export function tabsOf(set: TabSetName = "talent"): readonly PhoneTab[] {
  return SETS[set].tabs;
}

export function rootOf(tab: PhoneTab, set: TabSetName = "talent"): string {
  return SETS[set].roots[tab] ?? "/app";
}

/** The tab a page belongs to; the Fil for everything else (notifications, publications…). */
export function tabOf(pathname: string, set: TabSetName = "talent"): PhoneTab {
  const match = SETS[set].prefixes.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match ? match[1] : "fil";
}

/** The tab whose first screen this page is, or null for a page opened from a tab. */
export function rootTab(pathname: string, set: TabSetName = "talent"): PhoneTab | null {
  const path = pathname.replace(/\/$/, "") || "/";
  return SETS[set].tabs.find((tab) => SETS[set].roots[tab] === path) ?? null;
}

/** Pages opened from a tab that keep the bottom bar and Orbi (planches Entreprise, Personne). */
export function keepsBar(pathname: string, set: TabSetName = "talent") {
  return SETS[set].barPages.some((prefix) => pathname.startsWith(prefix));
}
