"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { PhoneIcon } from "@/components/phone/icon";
import { plural, useUnread } from "@/components/talent/header";
import {
  NOTIFS_PANEL_ID,
  NotificationsPanel,
  type NotificationsPanelLabels,
} from "@/components/talent/web/notifications-panel";
import { openOrbiPanel } from "@/components/talent/web/orbi-panel";
import { cx } from "@/lib/cx";
import { recruiterFullScreen } from "./side-nav";
import { recruiterTitleOf, type TitleKey } from "./titles";

/** Widths of the web frame: the top bar keeps the bell fresh there. */
const WEB = "(min-width: 768px)";

/** What the search looks for on a page (Web-App `SC`), and where it asks. */
type SearchKind = "candidates" | "offers" | "talents" | "fil";
const SEARCH: Record<SearchKind, { onglet?: string; scopes: readonly string[] }> = {
  candidates: { onglet: "candidatures", scopes: ["tout", "nom", "competence", "ville"] },
  offers: { scopes: ["tout", "offres", "candidats", "entreprises", "personnes"] },
  talents: { onglet: "talents", scopes: ["tout", "competence", "metier", "ville"] },
  fil: { onglet: "fil", scopes: ["tout", "personnes", "entreprises", "publications"] },
};

function searchOf(title: TitleKey): SearchKind {
  if (title === "offers" || title === "publish") return "offers";
  if (title === "talents") return "talents";
  if (title === "fil") return "fil";
  return "candidates";
}

type Group = {
  title: string;
  items: { href: string; title: string; sub?: string; sub2?: string }[];
};

export type RecruiterTopLabels = {
  titles: Record<TitleKey, string>;
  publish: string;
  orbi: string;
  notifications: { zero: string; one: string; other: string };
  panel: NotificationsPanelLabels;
  search: Record<SearchKind, string> & {
    searchIn: string;
    try: string;
    searching: string;
    none: string;
    close: string;
    clear: string;
    results: string;
    scopes: Record<string, string>;
  };
};

/**
 * Search in two steps (brief § 3, rule 2): on focus, the scopes of the page; from the first
 * letter, the results, grouped. Offers and candidates are the organization's only (the API
 * filters by `organizationId`).
 */
function RecruiterSearch({
  kind,
  labels,
}: {
  kind: SearchKind;
  labels: RecruiterTopLabels["search"];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("tout");
  const [found, setFound] = useState<{ key: string; groups: Group[] } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const config = SEARCH[kind];
  const q = query.trim();
  const key = `${scope}|${q}`;
  // Only the answer to what is written now: an older one waits for the next.
  const groups = found?.key === key ? found.groups : null;

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q, dans: scope });
      if (config.onglet) params.set("onglet", config.onglet);
      try {
        const response = await fetch(`/api/hire/recherche/telephone?${params}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { groups: Group[] };
        setFound({ key: `${scope}|${q}`, groups: data.groups ?? [] });
      } catch {
        if (!controller.signal.aborted) setFound({ key: `${scope}|${q}`, groups: [] });
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [q, scope, config.onglet]);

  // A click outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const typed = q.length > 0;
  return (
    <div
      ref={box}
      className="rb-rch"
      onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
    >
      <label>
        <PhoneIcon name="recherche" size={18} stroke={1.8} />
        <input
          type="search"
          value={query}
          placeholder={labels[kind]}
          aria-label={labels[kind]}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
        {typed && (
          <button
            type="button"
            className="rb-rch-x t-press"
            aria-label={labels.clear}
            onClick={() => setQuery("")}
          >
            <PhoneIcon name="fermer" size={16} stroke={2} />
          </button>
        )}
      </label>
      {open && (
        <div id={listId} className="rb-pop" role="region" aria-label={labels.results}>
          <p className="rb-meta">{labels.searchIn}</p>
          <div className="rb-pills" role="group" aria-label={labels.searchIn}>
            {config.scopes.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                className={cx("rb-pill t-press", scope === value && "rb-on")}
                onClick={() => setScope(value)}
              >
                {labels.scopes[value] ?? value}
              </button>
            ))}
          </div>
          {!typed ? (
            <p className="rb-meta rb-pop-p">{labels.try}</p>
          ) : groups === null ? (
            <p className="rb-meta rb-pop-p" role="status">
              {labels.searching}
            </p>
          ) : groups.length === 0 ? (
            <p className="rb-meta rb-pop-p" role="status">
              {labels.none}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="rb-pop-g">
                <p className="rb-meta">{group.title}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rb-r"
                    onClick={() => setOpen(false)}
                  >
                    <b>{item.title}</b>
                    {item.sub && <span className="rb-meta">{item.sub}</span>}
                  </Link>
                ))}
              </div>
            ))
          )}
          <button type="button" className="rb-pop-close t-press" onClick={() => setOpen(false)}>
            {labels.close}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The head of the recruiter's pages on a computer (Modèle B, lot N1, Web-App `.top`): the page's
 * name, the search in two steps, the bell (the notifications open under it) and « Publier une
 * offre » for the members who publish.
 */
export function RecruiterTop({
  labels,
  unread,
  canPublish,
  brief,
}: {
  labels: RecruiterTopLabels;
  unread: number;
  canPublish: boolean;
  /** Above the notifications under the bell: Orbi's brief of the day, streamed. */
  brief?: ReactNode;
}) {
  const pathname = usePathname();
  const count = useUnread(unread, WEB);

  useEffect(() => {
    const panel = document.getElementById(NOTIFS_PANEL_ID);
    if (panel?.matches(":popover-open")) panel.hidePopover();
  }, [pathname]);

  if (recruiterFullScreen(pathname) || pathname === "/app/orbi") return null;
  const title = recruiterTitleOf(pathname);
  return (
    <div className="rb-top">
      <p className="rb-top-h">{labels.titles[title]}</p>
      {/* A new page starts an empty search. */}
      <RecruiterSearch key={pathname} kind={searchOf(title)} labels={labels.search} />
      <span className="rb-sp" />
      <button
        type="button"
        aria-label={plural(labels.notifications, count)}
        aria-haspopup="dialog"
        popoverTarget={NOTIFS_PANEL_ID}
        className="rb-rond t-press"
      >
        <PhoneIcon name="cloche" size={20} stroke={1.8} />
        {count > 0 && <i aria-hidden className="rb-pt" />}
      </button>
      <NotificationsPanel labels={labels.panel} top={brief} />
      {canPublish && (
        <Link href="/app/hire/offres/nouvelle" className="rb-btn t-press">
          <PhoneIcon name="plus" size={18} stroke={2.4} />
          {labels.publish}
        </Link>
      )}
    </div>
  );
}

/** Orbi on a computer (Web-App `.orbiF`): the mint disc at the bottom right opens its panel. */
export function RecruiterOrbiButton({ label, children }: { label: string; children: ReactNode }) {
  const pathname = usePathname();
  if (recruiterFullScreen(pathname) || pathname === "/app/orbi") return null;
  return (
    <button
      type="button"
      className="rb-orbi t-press"
      aria-label={label}
      onClick={() => openOrbiPanel()}
    >
      {children}
    </button>
  );
}
