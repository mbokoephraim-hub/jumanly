"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { openOrbi } from "@/components/phone/orbi-bus";
import { signOut } from "@/server/actions/auth";

/** The line icons of the prototype (docs/mvp-web-recruteur/prototype, `P` of jumanly-hire.html). */
const PATHS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  offres: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
      <path d="M3 13h18" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.6a6.5 6.5 0 0 1 3.5 5.4" />
    </>
  ),
  cal: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />,
  chart: (
    <>
      <path d="M3 21h18" />
      <rect x="5" y="11" width="3" height="7" rx="1" />
      <rect x="10.5" y="5" width="3" height="13" rx="1" />
      <rect x="16" y="8" width="3" height="10" rx="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  orbi: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(-22 12 12)" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  team: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
  page: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M7 13h6M7 16h4" />
    </>
  ),
  journal: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.5" />
      <path d="M12 17h.01" />
    </>
  ),
  out: <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9M16 17l5-5-5-5M21 12H9" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
} as const;

export type HireIcon = keyof typeof PATHS;

function Ico({ name }: { name: HireIcon }) {
  return (
    <svg className="hf-ico" viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export type HireFrameLink = {
  href: string;
  label: string;
  icon: HireIcon;
  /** Other addresses that light this entry (« Vivier » for the talents of a pool). */
  match?: string[];
  exact?: boolean;
  count?: number;
};

export type HireFrameProps = {
  brand: { label: string; name: string; badge: string; home: string };
  nav: { label: string; items: HireFrameLink[] };
  tools: { label: string; items: HireFrameLink[] };
  actions: {
    publish: { href: string; label: string };
    orbi: string;
    help: { href: string; label: string };
    logout: string;
    search: { href: string; label: string };
    notifications: { href: string; label: string; unread: boolean };
    menu: string;
  };
  me: { href: string; name: string; org: string; initials: string; image: string | null };
};

function inside(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function lit(pathname: string, link: HireFrameLink) {
  if (link.exact) return pathname === link.href;
  return [link.href, ...(link.match ?? [])].some((path) => inside(pathname, path));
}

/**
 * The recruiter's frame of the MVP (prototype docs/mvp-web-recruteur, validated on 12/11/2026):
 * the floating bar at the top (the logo in a pill, the modules in the middle with the active one in
 * black, round icons on the right) and the column of round tools on the left (« Nouvelle offre »
 * in Lime, Orbi, the tools, help and sign-out at the bottom). Under 860 px the modules go to a
 * second line and the tools open from the menu button.
 */
export function HireFrame({ brand, nav, tools, actions, me }: HireFrameProps): ReactNode {
  const pathname = usePathname();
  // The column of tools opened on a phone, for the page where it was opened: another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const current = (link: HireFrameLink) => (lit(pathname, link) ? "page" : undefined);
  return (
    <>
      <header className="hf-top">
        <Link className="hf-logo" href={brand.home} aria-label={brand.label}>
          <svg viewBox="23.5 19.5 58 78" aria-hidden="true">
            <path
              d="M70 55 V70 A19 19 0 0 1 33.15 76.50"
              fill="none"
              stroke="#0F3F37"
              strokeWidth="17"
              strokeLinecap="round"
            />
            <circle cx="70" cy="31" r="11.5" fill="#A6F26B" />
          </svg>
          <b aria-hidden>{brand.name}</b>
          <i aria-hidden>{brand.badge}</i>
        </Link>
        <button
          type="button"
          className="hf-ibtn hf-burger"
          aria-label={actions.menu}
          aria-expanded={open}
          aria-controls="hf-outils"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <Ico name="menu" />
        </button>
        <nav className="hf-nav" aria-label={nav.label}>
          {nav.items.map((link) => (
            <Link key={link.href} href={link.href} aria-current={current(link)}>
              <Ico name={link.icon} />
              {link.label}
              {link.count ? (
                <span className="hf-cnt">{link.count > 99 ? "99+" : link.count}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="hf-right">
          <Link className="hf-ibtn" href={actions.search.href} aria-label={actions.search.label}>
            <Ico name="search" />
          </Link>
          <Link
            className="hf-ibtn"
            href={actions.notifications.href}
            aria-label={actions.notifications.label}
          >
            <Ico name="bell" />
            {actions.notifications.unread ? <span className="hf-badge" /> : null}
          </Link>
          <a className="hf-ibtn hf-help" href={actions.help.href} aria-label={actions.help.label}>
            <Ico name="help" />
          </a>
          <Link className="hf-me" href={me.href}>
            <span className="hf-av" aria-hidden>
              {me.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- a 32 px avatar
                <img src={me.image} alt="" width={32} height={32} />
              ) : (
                me.initials
              )}
            </span>
            <div>
              <b>{me.name}</b>
              <small>{me.org}</small>
            </div>
          </Link>
        </div>
      </header>
      <aside
        id="hf-outils"
        className="hf-rail"
        aria-label={tools.label}
        data-open={open ? "" : undefined}
      >
        <div className="hf-group">
          <Link
            className="hf-rbtn"
            data-lime=""
            href={actions.publish.href}
            aria-label={actions.publish.label}
          >
            <Ico name="plus" />
            <span className="hf-tip" aria-hidden>
              {actions.publish.label}
            </span>
          </Link>
          <button type="button" className="hf-rbtn" aria-label={actions.orbi} onClick={openOrbi}>
            <Ico name="orbi" />
            <span className="hf-tip" aria-hidden>
              {actions.orbi}
            </span>
          </button>
        </div>
        <nav className="hf-group" aria-label={tools.label}>
          {tools.items.map((link) => (
            <Link
              key={link.href}
              className="hf-rbtn"
              href={link.href}
              aria-label={link.label}
              aria-current={current(link)}
            >
              <Ico name={link.icon} />
              <span className="hf-tip" aria-hidden>
                {link.label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="hf-group" data-end="">
          <a className="hf-rbtn" href={actions.help.href} aria-label={actions.help.label}>
            <Ico name="help" />
            <span className="hf-tip" aria-hidden>
              {actions.help.label}
            </span>
          </a>
          <form action={signOut}>
            <button type="submit" className="hf-rbtn" aria-label={actions.logout}>
              <Ico name="out" />
              <span className="hf-tip" aria-hidden>
                {actions.logout}
              </span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
