import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  listNotifications,
  notificationKey,
  notificationValues,
} from "@/server/services/notifications";
import { avatarColor, initialsOf } from "./avatar";
import type { HireV3FrameProps, HireV3Link } from "./frame";
import type { HireIconName } from "./icon";

/** The icon beside a notification in the bell (the prototype's chips). */
function bellIcon(type: string): HireIconName {
  if (/message/i.test(type)) return "chat";
  if (/interview|slot|agenda/i.test(type)) return "cal";
  if (/test|assessment/i.test(type)) return "tests";
  if (/application|candidate|shortlist/i.test(type)) return "users";
  return "bell";
}

/**
 * Texts, links and figures of the frame of the recruiter's web app v3 (docs/mvp-web-recruteur/
 * prototype-v3, `TOPNAV` and `SIDENAV`): the seven buttons of the rail.
 */
export async function hireV3FrameProps(
  db: PrismaClient,
  input: {
    userId: string;
    name: string;
    org: string;
    roleLabel: string;
    newApplications: number;
    unreadMessages: number;
    unreadNotifications: number;
    appearance: "auto" | "light" | "dark";
  },
): Promise<HireV3FrameProps> {
  const t = await getTranslations("hireV3");
  const nav: HireV3Link[] = [
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
  const tools: HireV3Link[] = [
    { href: "/app/hire/entreprise", label: t("tools.company"), icon: "r_build" },
    { href: "/app/hire/tests", label: t("tools.tests"), icon: "r_tests" },
    { href: "/app/hire/suivi", label: t("tools.automation"), icon: "r_suivi" },
    { href: "/app/hire/compte/equipe", label: t("tools.team"), icon: "r_team" },
    { href: "/app/hire/compte/formule", label: t("tools.plan"), icon: "r_card" },
  ];
  const pages: HireV3Link[] = [
    ...nav.map((link) => ({ ...link, count: undefined })),
    ...tools,
    { href: "/app/hire/compte/aide", label: t("help"), icon: "help" },
    { href: "/app/hire/compte/profil", label: t("me.profile"), icon: "users" },
  ];
  const bell = {
    unread: input.unreadNotifications,
    items: await hireV3Notifications(db, input.userId, 4),
  };
  return {
    nav,
    tools,
    pages,
    bell,
    me: {
      name: input.name,
      org: input.org,
      line: `${input.roleLabel} · ${input.org}`,
      initials: initialsOf(input.name),
      color: avatarColor(input.name),
    },
    dark: input.appearance === "dark",
  };
}

/** The latest unread notifications, as the bell and the home show them. */
export async function hireV3Notifications(db: PrismaClient, userId: string, take: number) {
  const t = await getTranslations("hireV3");
  const tItem = await getTranslations("notifications.item");
  const format = await getFormatter();
  const now = new Date();
  const latest = (await listNotifications(db, userId)).slice(0, take);
  return latest.map((item) => {
    const values = notificationValues(item.payload);
    const key = notificationKey(item.type, values);
    return {
      id: item.id,
      href: item.href ?? "/app/notifications",
      icon: bellIcon(item.type),
      text: tItem.has(key as "newApplication")
        ? tItem(key as "newApplication", values)
        : t("bell.title"),
      meta: format.relativeTime(item.createdAt, now),
    };
  });
}
