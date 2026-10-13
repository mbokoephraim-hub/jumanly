import type { IconName } from "@/components/brand/icon";

/** Public site links. `key` points to `nav.<key>` in the texts. */
export const publicNavigation = [
  { key: "trainings", href: "/formations" },
  { key: "jobs", href: "/offres" },
  { key: "pricing", href: "/tarifs" },
] as const;

export type AppNavigationKey = "home" | "learn" | "career" | "jobs" | "messages";

/** Talent space modules. `key` points to `appNav.<key>`; icons from ressources/icones. */
export const talentNavigation: { key: AppNavigationKey; href: string; icon: IconName }[] = [
  { key: "home", href: "/app", icon: "accueil" },
  { key: "learn", href: "/app/learn", icon: "learn" },
  { key: "career", href: "/app/career", icon: "career" },
  { key: "jobs", href: "/app/jobs", icon: "jobs" },
  { key: "messages", href: "/app/messages", icon: "message" },
];
