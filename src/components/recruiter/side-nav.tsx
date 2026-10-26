"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PhoneIcon, type PhoneIconName } from "@/components/phone/icon";
import { SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { ORG_SHEET_ID } from "./header";

/**
 * The recruiter's sidebar on a computer (Modèle B, lot N1, capture 030, Web-App.dc.html `aside`):
 * Accueil · Fil · Offres · Candidatures · Agenda · Talents · Messages with their counts, PILOTAGE
 * (Tableau de bord, Mon espace), ENTREPRISE for the owner and the administrators (étape 3), then
 * Compte and the card « Changer de profil ». Tablet (768 to 1199 px): the same entries as a rail
 * of icons. Hidden on a phone, where the Modèle B bar takes over.
 */
export const recruiterWebNav = [
  { key: "home", href: "/app/hire", icon: "accueil", match: ["/app/notifications", "/app/orbi"] },
  { key: "fil", href: "/app/hire/fil", icon: "fil", match: ["/app/fil"] },
  { key: "offers", href: "/app/hire/offres", icon: "offres", match: [] },
  { key: "applications", href: "/app/hire/candidats", icon: "candidatures", match: [] },
  { key: "agenda", href: "/app/hire/entretiens", icon: "agenda", match: [] },
  { key: "talents", href: "/app/hire/talents", icon: "talents", match: ["/app/hire/viviers"] },
  { key: "messages", href: "/app/messages", icon: "messages", match: [] },
] as const satisfies readonly {
  key: string;
  href: string;
  icon: PhoneIconName;
  match: readonly string[];
}[];

export const recruiterPilotage = [
  { key: "dashboard", href: "/app/hire/rapports", icon: "tableau" },
  { key: "mine", href: "/app/hire/taches", icon: "monEspace" },
] as const satisfies readonly { key: string; href: string; icon: PhoneIconName }[];

/**
 * ENTREPRISE (étape 3, brief § 2): Équipe, Page entreprise, Formule et facturation, Journal and
 * Réglages, shown to `org_owner` and `org_admin` only.
 */
export const companyItems = [
  { key: "team", href: "/app/organisation/equipe", icon: "equipe" },
  { key: "page", href: "/app/organisation", icon: "pageEnt" },
  { key: "billing", href: "/app/organisation/facturation", icon: "facture" },
  { key: "journal", href: "/app/organisation/journal", icon: "oeil" },
  { key: "settings", href: "/app/organisation/reglages", icon: "curseurs" },
] as const satisfies readonly { key: string; href: string; icon: PhoneIconName }[];

type NavKey = (typeof recruiterWebNav)[number]["key"];
type PilotageKey = (typeof recruiterPilotage)[number]["key"];

export type RecruiterSideNavLabels = Record<NavKey | PilotageKey, string> & {
  aria: string;
  brand: string;
  brandAria: string;
  pilotage: string;
  pilotageAria: string;
  account: string;
  switch: string;
  /** « {name} : changer de profil ». */
  switchAria: string;
  /** The label of an entry with its count, by entry. */
  badges: Partial<Record<NavKey, string>>;
  /** ENTREPRISE (étape 3): the owner's and the administrators' part, web only. */
  entreprise: Record<(typeof companyItems)[number]["key"] | "aria" | "title", string>;
};

/** Pages reached from an item rather than from the sidebar: the item stays lit (étape 3, A6). */
const companyChildren: Record<string, string> = {
  "/app/organisation/structure": "/app/organisation/equipe",
};

const inside = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

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

/** The entry of the sidebar a page belongs to (Web-App `GRP`: notifications and Orbi → Accueil). */
export function recruiterNavOf(pathname: string): NavKey | PilotageKey | "account" | null {
  if (pathname === "/app/hire") return "home";
  const entry = recruiterWebNav.find(
    (item) =>
      item.href !== "/app/hire" &&
      [item.href, ...item.match].some((path) => inside(pathname, path)),
  );
  if (entry) return entry.key;
  if (recruiterWebNav[0].match.some((path) => inside(pathname, path))) return "home";
  const pilotage = recruiterPilotage.find((item) => inside(pathname, item.href));
  if (pilotage) return pilotage.key;
  if (inside(pathname, "/app/hire/compte") || inside(pathname, "/app/parametres")) return "account";
  return null;
}

/** Full-screen pages of the recruiter (first steps): no frame around them. */
export function recruiterFullScreen(pathname: string) {
  return /^\/app(\/hire)?\/bienvenue(\/.*)?$/.test(pathname);
}

const Count = ({ count }: { count: number }) =>
  count > 0 ? <b aria-hidden>{count > 99 ? "99+" : count}</b> : null;

export function RecruiterSideNav({
  labels,
  counts,
  avatar,
  name,
  org,
  company = false,
}: {
  labels: RecruiterSideNavLabels;
  /** The counts of the entries (new applications, today's appointments, …). */
  counts: Partial<Record<NavKey, number>>;
  /** The member administers the organization: ENTREPRISE is shown. */
  company?: boolean;
  /** Photo or initials, already drawn. */
  avatar: ReactNode;
  name: string;
  org: { name: string; mark: ReactNode };
}) {
  const pathname = usePathname();
  if (recruiterFullScreen(pathname)) return null;
  const on = recruiterNavOf(pathname);

  const entry = (
    item: { key: NavKey | PilotageKey; href: string; icon: PhoneIconName },
    rail: boolean,
  ) => {
    const active = on === item.key;
    const count = counts[item.key as NavKey] ?? 0;
    const badge = labels.badges[item.key as NavKey];
    return (
      <li key={item.key}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          aria-label={
            rail || (count > 0 && badge) ? (count > 0 && badge) || labels[item.key] : undefined
          }
          className={cx("rb-nv t-press", active && "rb-on")}
        >
          <PhoneIcon name={item.icon} size={rail ? 24 : 22} stroke={1.8} />
          {!rail && <span>{labels[item.key]}</span>}
          {rail ? count > 0 && <i aria-hidden className="rb-pt" /> : <Count count={count} />}
        </Link>
      </li>
    );
  };

  const company$ = (rail: boolean) =>
    company && (
      <>
        {!rail && (
          <p aria-hidden className="rb-slab">
            {labels.entreprise.title}
          </p>
        )}
        <nav aria-label={labels.entreprise.aria}>
          <ul>
            {companyItems.map((item) => {
              const active = companyOn(pathname, item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={rail ? labels.entreprise[item.key] : undefined}
                    className={cx("rb-nv t-press", active && "rb-on")}
                  >
                    <PhoneIcon name={item.icon} size={rail ? 24 : 22} stroke={1.8} />
                    {!rail && <span>{labels.entreprise[item.key]}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </>
    );

  const switchCard = (rail: boolean) => (
    <SheetButton
      target={ORG_SHEET_ID}
      label={labels.switchAria}
      className={cx("t-press", rail ? "rb-moi-r" : "rb-moi")}
    >
      <span aria-hidden className="rb-av">
        {avatar}
        <span className="rb-av-org">{org.mark}</span>
      </span>
      {!rail && (
        <span className="rb-moi-t">
          <b>{name}</b>
          <span>{labels.switch}</span>
        </span>
      )}
    </SheetButton>
  );

  const account = (rail: boolean) => (
    <Link
      href="/app/hire/compte"
      aria-current={on === "account" ? "page" : undefined}
      aria-label={rail ? labels.account : undefined}
      className={cx("rb-nv t-press", on === "account" && "rb-on")}
    >
      <PhoneIcon name="profil" size={rail ? 24 : 22} stroke={1.8} />
      {!rail && <span>{labels.account}</span>}
    </Link>
  );

  return (
    <>
      <aside className="t-sb t-rh-sb rb-side">
        <Link href="/app/hire" className="rb-logo" aria-label={labels.brandAria}>
          <span aria-hidden>{labels.brand}</span>
          <i aria-hidden />
        </Link>
        <nav aria-label={labels.aria}>
          <ul>{recruiterWebNav.map((item) => entry(item, false))}</ul>
        </nav>
        <p aria-hidden className="rb-slab">
          {labels.pilotage}
        </p>
        <nav aria-label={labels.pilotageAria}>
          <ul>{recruiterPilotage.map((item) => entry(item, false))}</ul>
        </nav>
        {company$(false)}
        <div className="rb-bas">
          {account(false)}
          {switchCard(false)}
        </div>
      </aside>

      <aside className="t-rl t-rh-rl rb-rail">
        <Link href="/app/hire" className="rb-logo-r" aria-label={labels.brandAria}>
          <i aria-hidden />
        </Link>
        <nav aria-label={labels.aria}>
          <ul>
            {recruiterWebNav.map((item) => entry(item, true))}
            {recruiterPilotage.map((item) => entry(item, true))}
          </ul>
        </nav>
        {company$(true)}
        <div className="rb-bas">
          {account(true)}
          {switchCard(true)}
        </div>
      </aside>
    </>
  );
}
