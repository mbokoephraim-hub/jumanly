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
  | "learn"
  | "career"
  | "jobs"
  | "messages"
  | "hire.jobs"
  | "hire.talents"
  | "hire.pools"
  | "hire.interviews"
  | "hire.reports"
  | "organization";

type AppNavigationItem = {
  key: AppNavigationKey;
  href: string;
  icon: IconName;
  /** false: sidebar only; on mobile the item is reached from the Hire dashboard. */
  pill?: boolean;
};

/** Talent space modules. `key` points to `appNav.<key>`; icons from ressources/icones. */
export const talentNavigation: AppNavigationItem[] = [
  { key: "home", href: "/app", icon: "accueil" },
  { key: "learn", href: "/app/learn", icon: "learn" },
  { key: "career", href: "/app/career", icon: "career" },
  { key: "jobs", href: "/app/jobs", icon: "jobs" },
  { key: "messages", href: "/app/messages", icon: "message" },
];

/** Organization space (Hire): shown when an organization is chosen in the space switcher. */
export const hireNavigation: AppNavigationItem[] = [
  { key: "home", href: "/app/hire", icon: "accueil" },
  { key: "hire.jobs", href: "/app/hire/offres", icon: "jobs" },
  { key: "hire.talents", href: "/app/hire/talents", icon: "recherche" },
  { key: "hire.pools", href: "/app/hire/viviers", icon: "equipe", pill: false },
  { key: "hire.interviews", href: "/app/hire/entretiens", icon: "calendrier", pill: false },
  { key: "hire.reports", href: "/app/hire/rapports", icon: "statistiques", pill: false },
  { key: "messages", href: "/app/messages", icon: "message" },
  { key: "organization", href: "/app/organisation", icon: "entreprise" },
];

/** Hire pages that the mobile navigation leaves out, linked from the Hire dashboard. */
export const hireShortcuts = hireNavigation.filter((item) => item.pill === false);
