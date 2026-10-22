"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PhoneIcon, type PhoneIconName } from "../icon";

type ResultItem = {
  href: string;
  title: string;
  sub?: string;
  initials?: string;
  image?: string | null;
  org?: boolean;
  icon?: PhoneIconName;
};
type ResultGroup = { title: string; items: ResultItem[] };
type Recent = { q: string; kind: string };

export type RhSearchSetup = {
  /** Name of the field for screen readers. */
  label: string;
  placeholder: string;
  /** « Rechercher dans »: the scopes of this page, the first one chosen. */
  scopes: { key: string; label: string }[];
  /** The line under the recent searches (what each scope covers). */
  note?: string;
  /** Kept apart per tab in this browser (a convenience only). */
  tab: string;
};

export type RhSearchTexts = {
  open: string;
  cancel: string;
  clear: string;
  searchIn: string;
  recent: string;
  empty: string;
};

const RECENT_MAX = 3;

function readRecents(tab: string): Recent[] {
  try {
    const raw = window.localStorage.getItem(`jm-rh-recherches-${tab}`);
    const list = raw ? (JSON.parse(raw) as Recent[]) : [];
    return Array.isArray(list) ? list.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function keepRecent(tab: string, recent: Recent) {
  try {
    const list = [recent, ...readRecents(tab).filter((item) => item.q !== recent.q)];
    window.localStorage.setItem(
      `jm-rh-recherches-${tab}`,
      JSON.stringify(list.slice(0, RECENT_MAX)),
    );
  } catch {
    // Private window: the recent searches are only a convenience.
  }
}

/**
 * The first screen of a recruiter's tab (planches Recruteur-fil, -offres, -candidatures, -talents,
 * -messages): the big title, the round buttons, the avatar that opens the account; then the page.
 * The search is in two steps (brief § 3, rule 2): touching the magnifier shows, under the head,
 * the field, « Rechercher dans » and the recent searches; from the first letter, the results
 * replace them. « Annuler » brings the page back as it was, scroll included.
 */
export function RhTabPage({
  title,
  subtitle,
  actions,
  avatar,
  search,
  texts,
  className,
  ownHeading = true,
  children,
}: {
  title: string;
  /** False while the page below still carries its own h1 (screens not redone yet). */
  ownHeading?: boolean;
  subtitle?: ReactNode;
  /** Buttons between the title and the avatar (« + », the bell…), after the magnifier. */
  actions?: ReactNode;
  avatar: ReactNode;
  search: RhSearchSetup | null;
  texts: RhSearchTexts;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState(search?.scopes[0]?.key ?? "tout");
  const [groups, setGroups] = useState<ResultGroup[] | null>(null);
  const [recents, setRecents] = useState<Recent[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !search) return;
    input.current?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from this browser on open
    setRecents(readRecents(search.tab));
  }, [open, search]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/hire/recherche/telephone?q=${encodeURIComponent(q)}&dans=${scope}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { groups: [] }))
        .then((data: { groups: ResultGroup[] }) => setGroups(data.groups))
        .catch(() => undefined);
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setGroups(null);
  };
  const typed = query.trim() !== "";

  return (
    <div className={className ? `nb-page nb-rh ${className}` : "nb-page nb-rh"}>
      <header className="nb-rh-tete">
        {ownHeading ? (
          <h1>{title}</h1>
        ) : (
          <p className="nb-rh-titre" aria-hidden>
            {title}
          </p>
        )}
        {search && !open ? (
          <button
            type="button"
            className="nb-recherche-rond"
            aria-label={texts.open}
            aria-expanded={false}
            onClick={() => setOpen(true)}
          >
            <PhoneIcon name="recherche" size={20} stroke={1.8} />
          </button>
        ) : null}
        {actions}
        {avatar}
      </header>
      {open && search ? (
        <div className="nb-rh-recherche" role="search">
          <div className="nb-rh-recherche-l">
            <label className="nb-rh-champ">
              <PhoneIcon name="recherche" size={20} stroke={1.8} />
              <input
                ref={input}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") close();
                }}
                aria-label={search.label}
                placeholder={search.placeholder}
                enterKeyHint="search"
              />
              {typed ? (
                <button
                  type="button"
                  aria-label={texts.clear}
                  className="nb-rh-effacer"
                  onClick={() => {
                    setQuery("");
                    setGroups(null);
                    input.current?.focus();
                  }}
                >
                  <PhoneIcon name="fermer" size={16} />
                </button>
              ) : null}
            </label>
            <button type="button" className="nb-rh-annuler" data-retour="" onClick={close}>
              {texts.cancel}
            </button>
          </div>
          <p className="nb-meta nb-rh-dans">{texts.searchIn}</p>
          <div className="nb-rh-pilules" role="radiogroup" aria-label={texts.searchIn}>
            {search.scopes.map((item) => (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={item.key === scope}
                className="nb-pilule"
                onClick={() => setScope(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {!typed ? (
            <>
              {recents.length > 0 ? (
                <>
                  <p className="nb-meta nb-rh-dans">{texts.recent}</p>
                  {recents.map((recent) => (
                    <button
                      key={recent.q}
                      type="button"
                      className="nb-rh-recent"
                      onClick={() => setQuery(recent.q)}
                    >
                      <PhoneIcon name="horloge" size={20} stroke={1.8} />
                      <span>{recent.q}</span>
                      <span className="nb-meta">{recent.kind}</span>
                    </button>
                  ))}
                </>
              ) : null}
              {search.note ? <p className="nb-meta nb-rh-note">{search.note}</p> : null}
            </>
          ) : groups === null ? null : groups.length === 0 ? (
            <p className="nb-vide">{texts.empty.replace("{query}", query.trim())}</p>
          ) : (
            groups.map((group) => (
              <section key={group.title} aria-label={group.title}>
                <p className="nb-meta nb-rh-groupe">{group.title}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nb-rh-res"
                    onClick={() =>
                      keepRecent(search.tab, {
                        q: query.trim(),
                        kind: group.title.replace(/\s*·.*$/, "").toLowerCase(),
                      })
                    }
                  >
                    <span
                      className="nb-rh-mini"
                      data-org={item.org ? "" : undefined}
                      data-icone={item.icon ? "" : undefined}
                    >
                      {item.icon ? (
                        <PhoneIcon name={item.icon} size={22} stroke={1.8} />
                      ) : item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a 48 px picture
                        <img src={item.image} alt="" />
                      ) : (
                        item.initials
                      )}
                    </span>
                    <span className="nb-rh-res-t">
                      <b>{item.title}</b>
                      {item.sub ? <span className="nb-meta">{item.sub}</span> : null}
                    </span>
                  </Link>
                ))}
              </section>
            ))
          )}
        </div>
      ) : null}
      <div className="nb-rh-corps" hidden={open && search !== null}>
        {subtitle ? <p className="nb-rh-sous">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
