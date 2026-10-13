import {
  BookOpen,
  BriefcaseBusiness,
  LayoutDashboard,
  MessagesSquare,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** Liens du site public. `cle` renvoie à `navigation.public.<cle>` dans les textes. */
export const navigationPublique = [
  { cle: "formations", href: "/formations" },
  { cle: "offres", href: "/offres" },
  { cle: "tarifs", href: "/tarifs" },
] as const;

export type CleNavigationEspace = "accueil" | "learn" | "career" | "jobs" | "connect";

/** Modules de l'espace talent. `cle` renvoie à `navigation.espace.<cle>`. */
export const navigationEspaceTalent: {
  cle: CleNavigationEspace;
  href: string;
  icone: LucideIcon;
}[] = [
  { cle: "accueil", href: "/app", icone: LayoutDashboard },
  { cle: "learn", href: "/app/learn", icone: BookOpen },
  { cle: "career", href: "/app/career", icone: TrendingUp },
  { cle: "jobs", href: "/app/jobs", icone: BriefcaseBusiness },
  { cle: "connect", href: "/app/messages", icone: MessagesSquare },
];
