/**
 * The five tabs of the phone interface (Modèle B, brief § 3): Fil · Explorer · Carrière ·
 * Formation · Messages, in that order, and the pages that belong to each.
 */
export const PHONE_TABS = ["fil", "explorer", "carriere", "formation", "messages"] as const;
export type PhoneTab = (typeof PHONE_TABS)[number];

export const TAB_ROOTS: Record<PhoneTab, string> = {
  fil: "/app",
  explorer: "/app/jobs",
  carriere: "/app/career/cv",
  formation: "/app/learn",
  messages: "/app/messages",
};

const prefixes: [string, PhoneTab][] = [
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
];

/** The tab a page belongs to; the Fil for everything else (notifications, publications…). */
export function tabOf(pathname: string): PhoneTab {
  const match = prefixes.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match ? match[1] : "fil";
}

/** The tab whose first screen this page is, or null for a page opened from a tab. */
export function rootTab(pathname: string): PhoneTab | null {
  const path = pathname.replace(/\/$/, "") || "/";
  return PHONE_TABS.find((tab) => TAB_ROOTS[tab] === path) ?? null;
}

/** Pages opened from a tab that keep the bottom bar and Orbi (planches Entreprise, Personne). */
const BAR_PAGES = ["/app/entreprises/", "/app/personnes/"];

export function keepsBar(pathname: string) {
  return BAR_PAGES.some((prefix) => pathname.startsWith(prefix));
}
