import {
  BookOpen,
  BriefcaseBusiness,
  LayoutDashboard,
  MessagesSquare,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** Public site links. `key` points to `nav.public.<key>` in the texts. */
export const publicNavigation = [
  { key: "courses", href: "/formations" },
  { key: "jobs", href: "/offres" },
  { key: "pricing", href: "/tarifs" },
] as const;

export type AppNavigationKey = "home" | "learn" | "career" | "jobs" | "connect";

/** Talent space modules. `key` points to `nav.app.<key>`. */
export const talentNavigation: { key: AppNavigationKey; href: string; icon: LucideIcon }[] = [
  { key: "home", href: "/app", icon: LayoutDashboard },
  { key: "learn", href: "/app/learn", icon: BookOpen },
  { key: "career", href: "/app/career", icon: TrendingUp },
  { key: "jobs", href: "/app/jobs", icon: BriefcaseBusiness },
  { key: "connect", href: "/app/messages", icon: MessagesSquare },
];
