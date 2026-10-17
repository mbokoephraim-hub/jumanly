import type { IconName } from "@/components/brand/icon";

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
  | "tabs.forMe"
  | "tabs.offers"
  | "tabs.learn"
  | "tabs.suivi"
  | "tabs.account"
  | "learn"
  | "career"
  | "jobs"
  | "messages"
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
 * Talent space (docs/ux-mobile-talent, V6 § B2): five destinations in the bottom bar of a phone,
 * Pour moi in the middle; the same five plus Career in the column of icons of a computer. `key`
 * points to `appNav.<key>`.
 */
export const talentNavigation: AppNavigationItem[] = [
  { key: "tabs.offers", href: "/app/jobs", icon: "jobs" },
  { key: "tabs.learn", href: "/app/learn", icon: "diplome" },
  { key: "tabs.forMe", href: "/app", icon: "accueil" },
  { key: "tabs.suivi", href: "/app/suivi", icon: "suivi" },
  { key: "tabs.account", href: "/app/compte", icon: "profil" },
  { key: "career", href: "/app/career", icon: "career", pill: false },
];

/** The destinations themselves: their page opens on the big title and the search (V7 § B1). */
export const talentTabPaths = ["/app", "/app/jobs", "/app/learn", "/app/suivi", "/app/compte"];

/**
 * Shortcuts of the Menu button (screen 34, V6 § B3), in order, after Orbi. `key` points to
 * `appNav.topMenu.<key>`.
 */
export const talentMenu = [
  { key: "cvs", href: "/app/career/cv", icon: "cv", tone: "bg-lime" },
  { key: "dashboard", href: "/app/tableau-de-bord", icon: "statistiques", tone: "bg-neon" },
  { key: "applications", href: "/app/jobs/candidatures", icon: "jobs", tone: "bg-[#BFEFDF]" },
  { key: "interviews", href: "/app/career/entretiens", icon: "message", tone: "bg-brume" },
  {
    key: "certificates",
    href: "/app/learn/attestations",
    icon: "certificat",
    tone: "bg-[#F6F3EE]",
  },
] as const satisfies readonly { key: string; href: string; icon: IconName; tone: string }[];

/**
 * Talent screens with their own fixed action bar at the bottom of a phone: the bottom bar steps
 * aside there (offer detail and application, Learning Room, conversation, CV editor, Mon espace).
 */
export function hidesTalentTabBar(pathname: string) {
  const [, app, section, page, more] = pathname.split("/");
  if (app !== "app" || !section) return false;
  if (section === "espace" || section === "bienvenue") return true;
  // Mon profil has its own bar « Enregistré · Voir mon profil côté recruteur » (screen 25).
  if (section === "profil") return true;
  if (section === "jobs") return Boolean(page) && !["candidatures", "enregistrees"].includes(page);
  if (section === "messages") return Boolean(page);
  if (section === "suivi") return page === "entretiens" && Boolean(more);
  if (section === "learn") {
    const lists = ["attestations", "coach", "evaluations", "explorer", "parcours"];
    return Boolean(page) && !lists.includes(page);
  }
  if (section === "career") return page === "cv" && Boolean(more) && more !== "modeles";
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
