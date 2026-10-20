import type { IconName } from "@/components/brand/icon";
import type { TalentIconName } from "@/components/talent/icon";

/** Public site links. `key` points to `nav.<key>` in the texts. */
export const publicNavigation = [
  { key: "trainings", href: "/formations" },
  { key: "jobs", href: "/offres" },
  { key: "pricing", href: "/tarifs" },
] as const;

/** "Solutions" menu: one page per audience. */
export const solutionsNavigation = [
  { key: "talents", href: "/talents" },
  { key: "recruiters", href: "/recruteurs" },
  { key: "companies", href: "/entreprises" },
  { key: "partners", href: "/partenaires" },
] as const;

/** Public header (mockup 00-04): the four audiences, then the catalogs and pricing. */
export const publicHeaderNavigation = [...solutionsNavigation, ...publicNavigation] as const;

/** Footer columns. `key` points to `footer.col.<column>.<key>`. */
export const footerNavigation = {
  solutions: [
    { key: "talents", href: "/talents" },
    { key: "rh", href: "/recruteurs" },
    { key: "companies", href: "/entreprises" },
    { key: "partners", href: "/partenaires" },
  ],
  discover: [
    { key: "trainings", href: "/formations" },
    { key: "jobs", href: "/offres" },
    { key: "pricing", href: "/tarifs" },
    { key: "about", href: "/a-propos" },
    { key: "faq", href: "/faq" },
  ],
} as const;

/** Legal pages. `key` points to `footer.legal.<key>` and `legal.nav.<key>`. */
export const legalNavigation = [
  { key: "notice", href: "/mentions-legales" },
  { key: "privacy", href: "/confidentialite" },
  { key: "terms", href: "/conditions" },
  { key: "cookies", href: "/cookies" },
] as const;

export type AppNavigationKey =
  | "home"
  | "hire.jobs"
  | "hire.talents"
  | "hire.pools"
  | "hire.interviews"
  | "hire.reports"
  | "hire.templates"
  | "hire.messages"
  | "organization"
  | "partnerLicenses"
  | "partnerReports";

type AppNavigationItem = {
  key: AppNavigationKey;
  href: string;
  icon: IconName;
  /** false: sidebar only; on mobile the item is reached from the Hire dashboard. */
  pill?: boolean;
};

/**
 * Bottom bar of the talent space (docs/refonte-mobile, brief § 2.1): Pour moi · Offres · Orbi
 * (the round in the middle) · Apprendre · Suivi. The account opens from the avatar. `key` points to
 * `talentShell.nav.<key>`.
 */
export const talentTabs = [
  { key: "forMe", href: "/app", icon: "accueil" },
  { key: "offers", href: "/app/jobs", icon: "opportunites" },
  { key: "orbi", href: "/app/orbi", icon: "orbi" },
  { key: "learn", href: "/app/learn", icon: "former" },
  { key: "suivi", href: "/app/suivi", icon: "candidature" },
] as const satisfies readonly { key: string; href: string; icon: TalentIconName }[];

export type TalentTab = (typeof talentTabs)[number];

/** The tab a page belongs to: its own path, or the tab whose path contains it. */
export function talentTabOf(pathname: string): TalentTab | null {
  if (pathname === "/app") return talentTabs[0];
  return (
    talentTabs.find(
      (tab) =>
        tab.href !== "/app" && (pathname === tab.href || pathname.startsWith(`${tab.href}/`)),
    ) ?? null
  );
}

/** The destinations themselves: their page opens on the big title, the round buttons, the avatar. */
export const talentTabPaths: string[] = talentTabs.map((tab) => tab.href);

/**
 * Talent screens with their own fixed action bar at the bottom of a phone: the bottom bar steps
 * aside there (offer detail and application, Learning Room, conversation, CV editor, Mon espace).
 */
export function hidesTalentTabBar(pathname: string) {
  const [, app, section, page] = pathname.split("/");
  if (app !== "app" || !section) return false;
  if (section === "bienvenue") return true;
  // Lot 7: subscription, payment, settings, search and the tester tool draw their own head
  // (planche talent-4 § 7 and § 8), without the bar.
  if (["abonnement", "parametres", "recherche", "testeur"].includes(section)) return true;
  // Compte and Connexions open from the avatar and draw their own head (planche talent-4 § 2).
  if (section === "compte") return true;
  // Orbi opens as a conversation page: back arrow at the top, the composer in place of the bar.
  if (section === "orbi") return true;
  // Mon profil and its screens draw their own head (planche talent-4 § 3).
  if (section === "profil") return true;
  if (section === "jobs") return Boolean(page) && !["candidatures", "enregistrees"].includes(page);
  // Messages and notifications open from the head and draw their own (planche talent-2 § 5).
  if (section === "messages" || section === "notifications") return true;
  if (section === "suivi") return Boolean(page);
  // Every page of Apprendre under its home draws its own head (planche talent-3).
  if (section === "learn") return Boolean(page);
  if (section === "career")
    return (
      // Lot 6b and 6c: the diagnostic, the plan, the practice, CV et documents, LinkedIn and the
      // letters draw their own head (planche talent-4 § 5 and § 6).
      page === "cv" ||
      page === "linkedin" ||
      page === "documents" ||
      page === "entretiens" ||
      page === "diagnostic" ||
      page === "plan"
    );
  return false;
}

/** Organization space (Hire): shown when an organization is chosen in the space switcher. */
export const hireNavigation: AppNavigationItem[] = [
  { key: "home", href: "/app/hire", icon: "accueil" },
  { key: "hire.jobs", href: "/app/hire/offres", icon: "jobs" },
  { key: "hire.talents", href: "/app/hire/talents", icon: "hire" },
  { key: "hire.pools", href: "/app/hire/viviers", icon: "equipe", pill: false },
  { key: "hire.interviews", href: "/app/hire/entretiens", icon: "calendrier", pill: false },
  { key: "hire.messages", href: "/app/messages", icon: "connect" },
  { key: "hire.reports", href: "/app/hire/rapports", icon: "statistiques", pill: false },
  { key: "hire.templates", href: "/app/hire/modeles", icon: "edit", pill: false },
  { key: "organization", href: "/app/organisation", icon: "entreprise" },
];

/** Hire pages that the mobile navigation leaves out, linked from the Hire dashboard. */
export const hireShortcuts = hireNavigation.filter((item) => item.pill === false);

/** Partner space (Jumanly Partners): licences and aggregated reports only. */
export const partnerNavigation: AppNavigationItem[] = [
  { key: "home", href: "/app/partenaire", icon: "accueil" },
  { key: "partnerLicenses", href: "/app/partenaire/licences", icon: "certificat" },
  { key: "partnerReports", href: "/app/partenaire/rapports", icon: "statistiques" },
];

/**
 * Bottom bar of the recruiter space (docs/refonte-mobile, brief recruteur § 1): À traiter ·
 * Offres · Orbi (the round in the middle) · Candidats · Messages. The account opens from the
 * avatar, the active organization from the chip of the head. `key` points to
 * `hireShell.nav.<key>`; `also` lists the other paths a tab covers.
 */
export const recruiterTabs = [
  { key: "today", href: "/app/hire", icon: "aujourdhui", also: [] },
  { key: "offers", href: "/app/hire/offres", icon: "offre", also: [] },
  { key: "orbi", href: "/app/orbi", icon: "orbi", also: [] },
  {
    key: "candidates",
    href: "/app/hire/talents",
    icon: "candidats",
    also: ["/app/hire/candidats", "/app/hire/viviers", "/app/hire/entretiens"],
  },
  { key: "messages", href: "/app/messages", icon: "message", also: [] },
] as const satisfies readonly {
  key: string;
  href: string;
  icon: TalentIconName;
  also: readonly string[];
}[];

export type RecruiterTab = (typeof recruiterTabs)[number];

const inside = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

/** The tab a recruiter page belongs to: À traiter only for its own page. */
export function recruiterTabOf(pathname: string): RecruiterTab | null {
  if (pathname === "/app/hire") return recruiterTabs[0];
  return (
    recruiterTabs.find(
      (tab) =>
        tab.href !== "/app/hire" && [tab.href, ...tab.also].some((path) => inside(pathname, path)),
    ) ?? null
  );
}

/**
 * Recruiter screens without the bottom bar (brief recruteur § 1): the work screens (a new or
 * edited offer, a candidate's file, a conversation), the screens opened from the head (account,
 * notifications, search) and Orbi, which opens as a conversation page.
 */
export function hidesRecruiterTabBar(pathname: string) {
  const [, app, section, page, sub] = pathname.split("/");
  if (app !== "app" || !section) return false;
  if (
    [
      "bienvenue",
      "abonnement",
      "parametres",
      "recherche",
      "testeur",
      "notifications",
      "orbi",
      "organisation",
      "compte",
      "profil",
    ].includes(section)
  )
    return true;
  if (section === "messages") return Boolean(page);
  if (section !== "hire") return false;
  if (page === "compte") return true;
  // Lot 2: an offer, its four steps and its job sheet have their own bar at the bottom.
  if (page === "offres") return Boolean(sub);
  if (page === "candidats") return Boolean(sub);
  return false;
}
