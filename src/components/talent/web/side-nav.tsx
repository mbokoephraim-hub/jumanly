"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { talentTabOf, talentTabs } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { TalentIcon, type TalentIconName } from "../icon";
import { OrbiMark } from "../orbi-mark";

export type SideNavLabels = Record<(typeof talentTabs)[number]["key"], string> & {
  aria: string;
  badge: string;
  home: string;
  brand: string;
  more: string;
  messages: string;
  messagesAria: string;
  cv: string;
  connections: string;
  settings: string;
  accountKind: string;
  account: string;
  shortcut: string;
};

/** Pages of the full-screen first steps (brief § 2.5): no frame around them. */
export function fullScreen(pathname: string) {
  return pathname === "/app/bienvenue" || pathname.startsWith("/app/bienvenue/");
}

/**
 * Classroom of a course (planche web talent-3 § 4-5): the lesson and the quiz open in « mode
 * concentré », the sidebar shrinks to the rail and the top bar steps aside. The exercise and the
 * result of a quiz, at the same address, put the frame back (`FullFrame`).
 */
export function classroom(pathname: string) {
  return /^\/app\/learn\/(?!attestations\/|parcours\/)[^/]+\/[^/]+$/.test(pathname);
}

/** Lime tile with the Sapin « j » (ressources/logos, served by `pnpm brand`). */
const TILE = "/marque/jumanly-symbole-lime.svg";

const inside = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

/** The entries under the separator (planche web.py `SEC`, talent), then Paramètres at the bottom. */
const secondary: { key: "messages" | "cv" | "connections"; href: string; icon: TalentIconName }[] =
  [
    { key: "messages", href: "/app/messages", icon: "message" },
    { key: "cv", href: "/app/career/cv", icon: "cv" },
    { key: "connections", href: "/app/compte/connexions", icon: "connexion" },
  ];

const Badge = ({ count }: { count: number }) =>
  count > 0 ? <b aria-hidden>{count > 9 ? "9+" : count}</b> : null;

/**
 * Navigation of the web frame (docs/refonte-web, brief § 2.1 to 2.3, planche web.py `_sb` and
 * `_rl`). Computer (≥ 1200 px): the 232 px sidebar, logo, Pour moi · Offres · Orbi (a card with
 * `Ctrl K`) · Apprendre · Suivi, a separator, Messages · Mes CV · Connexions, then Paramètres and the
 * avatar card. Tablet (768 to 1199 px): the 84 px rail of icons. Hidden on a phone (bottom bar).
 * Both share the name « Navigation principale »: only one is ever shown.
 */
export function TalentSideNav({
  labels,
  followUp,
  unreadMessages,
  avatar,
  name,
}: {
  labels: SideNavLabels;
  /** Actions to take in Suivi (Corail counter). */
  followUp: number;
  /** Conversations with an unread message (Corail counter). */
  unreadMessages: number;
  /** Photo or initials, already drawn. */
  avatar: ReactNode;
  name: string;
}) {
  const pathname = usePathname();
  if (fullScreen(pathname)) return null;
  const current = talentTabOf(pathname)?.href ?? null;
  const focus = classroom(pathname);

  const primary = (rail: boolean) =>
    talentTabs.map((tab) => {
      const on = current === tab.href;
      const badge = tab.key === "suivi" ? followUp : 0;
      if (tab.key === "orbi")
        return (
          <li key={tab.key}>
            <Link
              href={tab.href}
              aria-current={on ? "page" : undefined}
              className={cx("t-sb-orb t-press", on && "t-on")}
            >
              {rail ? (
                <span className="t-rond">
                  <OrbiMark size={40} state={on ? "reflechit" : "repos"} />
                </span>
              ) : (
                <OrbiMark size={34} state={on ? "reflechit" : "repos"} />
              )}
              <span>{labels.orbi}</span>
              {!rail && (
                <kbd aria-hidden className="t-kbd">
                  {labels.shortcut}
                </kbd>
              )}
            </Link>
          </li>
        );
      return (
        <li key={tab.key}>
          <Link
            href={tab.href}
            aria-current={on ? "page" : undefined}
            className={cx("t-sb-it t-press", on && "t-on")}
          >
            <TalentIcon name={tab.icon} on={on} size={rail ? undefined : "s"} />
            <span>{labels[tab.key]}</span>
            {!rail && <Badge count={badge} />}
            {badge > 0 && <span className="sr-only">{labels.badge}</span>}
          </Link>
        </li>
      );
    });

  return (
    <>
      <aside className={cx("t-sb", focus && "t-concentre")}>
        <Link href="/app" className="t-sb-lg" aria-label={labels.home}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a 30 px brand tile */}
          <img src={TILE} alt="" className="t-j" />
          <span aria-hidden className="t-mot">
            {labels.brand}
          </span>
        </Link>
        <nav aria-label={labels.aria}>
          <ul>{primary(false)}</ul>
        </nav>
        <div aria-hidden className="t-sb-sep" />
        <nav aria-label={labels.more}>
          <ul>
            {secondary.map((item) => {
              const on = inside(pathname, item.href);
              const count = item.key === "messages" ? unreadMessages : 0;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={on ? "page" : undefined}
                    aria-label={item.key === "messages" ? labels.messagesAria : undefined}
                    className={cx("t-sb-it t-press", on && "t-on")}
                  >
                    <TalentIcon name={item.icon} on={on} size="s" />
                    <span>{labels[item.key]}</span>
                    <Badge count={count} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="t-sb-bas">
          <Link
            href="/app/parametres"
            aria-current={inside(pathname, "/app/parametres") ? "page" : undefined}
            className={cx("t-sb-it t-press", inside(pathname, "/app/parametres") && "t-on")}
          >
            <TalentIcon name="reglages" size="s" on={inside(pathname, "/app/parametres")} />
            <span>{labels.settings}</span>
          </Link>
          <Link
            href="/app/compte"
            aria-label={labels.account}
            aria-current={pathname === "/app/compte" ? "page" : undefined}
            className="t-sb-moi t-press"
          >
            <span aria-hidden className="t-av">
              {avatar}
            </span>
            <span className="t-t">
              <b>{name}</b>
              <span>{labels.accountKind}</span>
            </span>
            <TalentIcon name="suivant" size="xs" />
          </Link>
        </div>
      </aside>

      <aside className={cx("t-rl", focus && "t-concentre")}>
        <Link href="/app" className="t-rl-lg" aria-label={labels.home}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a 40 px brand tile */}
          <img src={TILE} alt="" className="t-j" />
        </Link>
        <nav aria-label={labels.aria}>
          <ul>{primary(true)}</ul>
        </nav>
        <Link href="/app/compte" aria-label={labels.account} className="t-av t-rl-av t-press">
          {avatar}
        </Link>
      </aside>
    </>
  );
}
