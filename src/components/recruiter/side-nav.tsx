"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { recruiterSecondary, recruiterTabOf, recruiterTabs } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { SheetButton } from "@/components/talent/sheet";
import { ORG_SHEET_ID } from "./header";

export type RecruiterSideNavLabels = Record<(typeof recruiterTabs)[number]["key"], string> &
  Record<(typeof recruiterSecondary)[number]["key"], string> & {
    aria: string;
    more: string;
    home: string;
    brand: string;
    messagesAria: string;
    settings: string;
    account: string;
    shortcut: string;
    /** « Organisation active : … Changer ». */
    org: string;
    /** ENTREPRISE (étape 3): the owner's and the administrators' part, web only. */
    entreprise: Record<(typeof companyItems)[number]["key"] | "aria" | "title", string>;
  };

/**
 * ENTREPRISE (étape 3, brief § 2): Équipe, Page entreprise, Formule et facturation, Journal and
 * Réglages, shown to `org_owner` and `org_admin` only.
 */
export const companyItems = [
  { key: "team", href: "/app/organisation/equipe", icon: "candidats" },
  { key: "page", href: "/app/organisation", icon: "entreprise" },
  { key: "billing", href: "/app/organisation/facturation", icon: "portefeuille" },
  { key: "journal", href: "/app/organisation/journal", icon: "confidentialite" },
  { key: "settings", href: "/app/organisation/reglages", icon: "reglages" },
] as const;

/** Pages reached from an item rather than from the sidebar: the item stays lit (étape 3, A6). */
const companyChildren: Record<string, string> = {
  "/app/organisation/structure": "/app/organisation/equipe",
};

function companyOn(pathname: string, href: string) {
  const parent = Object.entries(companyChildren).find(([path]) => inside(pathname, path))?.[1];
  if (parent) return parent === href;
  // « Page entreprise » covers /app/organisation and its pages, except those of the other items.
  if (href === "/app/organisation")
    return (
      inside(pathname, href) &&
      !companyItems.some((item) => item.href !== href && inside(pathname, item.href))
    );
  return inside(pathname, href);
}

/** Full-screen pages of the recruiter (first steps): no frame around them. */
export function recruiterFullScreen(pathname: string) {
  return /^\/app(\/hire)?\/bienvenue(\/.*)?$/.test(pathname);
}

/** Lime tile with the Sapin « j » (ressources/logos, served by `pnpm brand`). */
const TILE = "/marque/jumanly-symbole-lime.svg";

const inside = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

const Badge = ({ count }: { count: number }) =>
  count > 0 ? <b aria-hidden>{count > 9 ? "9+" : count}</b> : null;

/**
 * Navigation of the recruiter's web frame (docs/refonte-web, brief § 2.1 to 2.3, planche web.py
 * `_sb` and `_rl` with `rh`, planche web recruteur-1). Computer (≥ 1200 px): the 232 px sidebar,
 * the logo, the active organization (its menu opens under the name), À traiter · Offres · Orbi (a
 * card with `Ctrl K`) · Candidats · Messages, a separator, Agenda · Talents · Rapports, then
 * Paramètres and the card of the account. Tablet (768 to 1199 px): the 84 px rail of icons, the
 * organization under the logo. Hidden on a phone, where the bottom bar and the head take over.
 * Same classes as the talent's frame (`TalentSideNav`): one look for both spaces.
 */
export function RecruiterSideNav({
  labels,
  unreadMessages,
  avatar,
  name,
  line,
  org,
  company = false,
}: {
  labels: RecruiterSideNavLabels;
  /** The member administers the organization: ENTREPRISE is shown. */
  company?: boolean;
  unreadMessages: number;
  /** Photo or initials, already drawn. */
  avatar: ReactNode;
  name: string;
  /** Job title, or the role in the organization. */
  line: string;
  org: { name: string; mark: ReactNode };
}) {
  const pathname = usePathname();
  if (recruiterFullScreen(pathname)) return null;
  const current = recruiterTabOf(pathname)?.href ?? null;
  // Agenda, Talents and Rapports light up on their own pages (Candidats keeps its lists).
  const secondaryOn = recruiterSecondary.find((item) => inside(pathname, item.match))?.key;
  const primaryOn = secondaryOn ? null : current;

  const primary = (rail: boolean) =>
    recruiterTabs.map((tab) => {
      const on = primaryOn === tab.href;
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
      const count = tab.key === "messages" ? unreadMessages : 0;
      return (
        <li key={tab.key}>
          <Link
            href={tab.href}
            aria-current={on ? "page" : undefined}
            aria-label={count > 0 ? labels.messagesAria : undefined}
            className={cx("t-sb-it t-press", on && "t-on")}
          >
            <TalentIcon name={tab.icon} on={on} size={rail ? undefined : "s"} />
            <span>{labels[tab.key]}</span>
            {!rail && <Badge count={count} />}
          </Link>
        </li>
      );
    });

  const orgButton = (rail: boolean) => (
    <SheetButton
      target={ORG_SHEET_ID}
      label={labels.org}
      className={cx("t-press", rail ? "t-rl-org" : "t-sb-org")}
    >
      {org.mark}
      {!rail && <span>{org.name}</span>}
      {!rail && <TalentIcon name="suivant" size="xs" />}
    </SheetButton>
  );

  return (
    <>
      <aside className="t-sb t-rh-sb">
        <Link href="/app/hire" className="t-sb-lg" aria-label={labels.home}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a 30 px brand tile */}
          <img src={TILE} alt="" className="t-j" />
          <span aria-hidden className="t-mot">
            {labels.brand}
          </span>
        </Link>
        {orgButton(false)}
        <nav aria-label={labels.aria}>
          <ul>{primary(false)}</ul>
        </nav>
        <div aria-hidden className="t-sb-sep" />
        <nav aria-label={labels.more}>
          <ul>
            {recruiterSecondary.map((item) => {
              const on = secondaryOn === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={on ? "page" : undefined}
                    className={cx("t-sb-it t-press", on && "t-on")}
                  >
                    <TalentIcon name={item.icon} on={on} size="s" />
                    <span>{labels[item.key]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {company && (
          <>
            <div aria-hidden className="t-sb-sep" />
            <p aria-hidden className="t-sb-titre">
              {labels.entreprise.title}
            </p>
            <nav aria-label={labels.entreprise.aria}>
              <ul>
                {companyItems.map((item) => {
                  const on = companyOn(pathname, item.href);
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={on ? "page" : undefined}
                        className={cx("t-sb-it t-press", on && "t-on")}
                      >
                        <TalentIcon name={item.icon} on={on} size="s" />
                        <span>{labels.entreprise[item.key]}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        )}
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
            href="/app/hire/compte"
            aria-label={labels.account}
            aria-current={pathname === "/app/hire/compte" ? "page" : undefined}
            className="t-sb-moi t-press"
          >
            <span aria-hidden className="t-av">
              {avatar}
            </span>
            <span className="t-t">
              <b>{name}</b>
              <span>{line}</span>
            </span>
            <TalentIcon name="suivant" size="xs" />
          </Link>
        </div>
      </aside>

      <aside className="t-rl t-rh-rl">
        <Link href="/app/hire" className="t-rl-lg" aria-label={labels.home}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a 40 px brand tile */}
          <img src={TILE} alt="" className="t-j" />
        </Link>
        {orgButton(true)}
        <nav aria-label={labels.aria}>
          <ul>{primary(true)}</ul>
        </nav>
        {company && (
          <nav aria-label={labels.entreprise.aria}>
            <ul>
              {companyItems.map((item) => {
                const on = companyOn(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-label={labels.entreprise[item.key]}
                      aria-current={on ? "page" : undefined}
                      className={cx("t-sb-it t-press", on && "t-on")}
                    >
                      <TalentIcon name={item.icon} on={on} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        <Link href="/app/hire/compte" aria-label={labels.account} className="t-av t-rl-av t-press">
          {avatar}
        </Link>
      </aside>
    </>
  );
}
