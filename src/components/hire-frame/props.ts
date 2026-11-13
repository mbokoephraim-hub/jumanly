import "server-only";
import { getTranslations } from "next-intl/server";
import { initials } from "@/components/ui/avatar";
import type { HireFrameLink, HireFrameProps } from "./frame";

/**
 * The texts and links of the recruiter's frame (mode MVP, docs/mvp-web-recruteur lot M0). The modules
 * follow the prototype; the tools give the pages that exist today (tests and automatic follow-up
 * join with lots M5 and M7). The company's part (page, journal, settings, billing) is for its
 * administrators; a member sees the team and the plan from their account.
 */
export async function hireFrameProps(input: {
  name: string;
  image: string | null;
  org: string;
  company: boolean;
  newApplications: number;
  unreadMessages: number;
  unreadNotifications: boolean;
}): Promise<HireFrameProps> {
  const t = await getTranslations("hireFrame");
  const nav: HireFrameLink[] = [
    { href: "/app/hire", label: t("nav.home"), icon: "home", exact: true },
    { href: "/app/hire/offres", label: t("nav.offers"), icon: "offres" },
    {
      href: "/app/hire/candidats",
      label: t("nav.candidates"),
      icon: "users",
      count: input.newApplications,
    },
    { href: "/app/hire/entretiens", label: t("nav.agenda"), icon: "cal" },
    {
      href: "/app/hire/viviers",
      label: t("nav.pool"),
      icon: "layers",
      match: ["/app/hire/talents"],
    },
    {
      href: "/app/messages",
      label: t("nav.messages"),
      icon: "chat",
      count: input.unreadMessages,
    },
    { href: "/app/hire/rapports", label: t("nav.reports"), icon: "chart" },
  ];
  const tools: HireFrameLink[] = [
    { href: "/app/hire/modeles", label: t("tools.templates"), icon: "mail" },
    ...(input.company
      ? ([
          { href: "/app/organisation/equipe", label: t("tools.team"), icon: "team" },
          { href: "/app/organisation/facturation", label: t("tools.plan"), icon: "card" },
          { href: "/app/organisation", label: t("tools.page"), icon: "page", exact: true },
          { href: "/app/organisation/journal", label: t("tools.journal"), icon: "journal" },
          { href: "/app/organisation/reglages", label: t("tools.settings"), icon: "settings" },
        ] satisfies HireFrameLink[])
      : ([
          { href: "/app/hire/compte/equipe", label: t("tools.team"), icon: "team" },
          { href: "/app/hire/compte/formule", label: t("tools.plan"), icon: "card" },
        ] satisfies HireFrameLink[])),
  ];
  return {
    brand: { label: t("brand"), name: t("name"), badge: t("badge"), home: "/app/hire" },
    nav: { label: t("nav.aria"), items: nav },
    tools: { label: t("tools.aria"), items: tools },
    actions: {
      publish: { href: "/app/hire/offres/nouvelle", label: t("publish") },
      orbi: t("orbi"),
      help: { href: "mailto:assistant@jumanly.io", label: t("help") },
      logout: t("logout"),
      search: { href: "/app/hire/candidats", label: t("search") },
      notifications: {
        href: "/app/notifications",
        label: t("notifications"),
        unread: input.unreadNotifications,
      },
      menu: t("menu"),
    },
    me: {
      href: "/app/hire/compte",
      name: input.name,
      org: input.org,
      initials: initials(input.name),
      image: input.image,
    },
  };
}
