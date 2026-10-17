"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import type { SearchPreviewItem } from "@/app/api/recherche/apercu/route";
import { recentSearches } from "./recent-searches";

/** Where the words go and where « Filtres » leads, for each destination. */
const targets: Record<string, { action: string; filters: string }> = {
  "/app": { action: "/app/recherche", filters: "/app/jobs?filtres=1" },
  "/app/jobs": { action: "/app/jobs", filters: "/app/jobs?filtres=1" },
  "/app/learn": { action: "/app/learn/explorer", filters: "/app/learn/explorer" },
  "/app/suivi": { action: "/app/recherche", filters: "/app/suivi#suivi-filtres" },
};

/** Filters of the offers counted on the badge of « Filtres » (screen 06). */
const jobFilterKeys = ["pays", "ville", "contrat", "teletravail", "experience", "publie", "compat"];

const kindIcons: Record<SearchPreviewItem["kind"], IconName> = { job: "jobs", course: "learn" };

/** The words of `title` that match `query`, in bold. */
function highlight(title: string, query: string): ReactNode {
  const index = title.toLocaleLowerCase("fr").indexOf(query.toLocaleLowerCase("fr"));
  if (!query || index < 0) return title;
  return (
    <>
      {title.slice(0, index)}
      <strong className="font-semibold">{title.slice(index, index + query.length)}</strong>
      {title.slice(index + query.length)}
    </>
  );
}

export type OrbiSearchLabels = {
  label: string;
  placeholder: string;
  filters: string;
  filtersCount: { one: string; other: string };
  askTitle: string;
  askSoon: string;
  results: string;
  kind: Record<SearchPreviewItem["kind"], string>;
  recent: string;
  seeAll: string;
};

/**
 * The one search bar of the destinations (docs/ux-mobile-talent V7 § B1, screens 03, 06, 18):
 * « Rechercher ou demander à Orbi », the orb of Orbi, and « Filtres » beside it. Typing opens a list
 * under the bar, not a new screen: Orbi first (its place, until the assistant arrives), three
 * results, the recent searches, « Voir tous les résultats ». A GET form that works without
 * JavaScript.
 */
export function OrbiSearch({ labels }: { labels: OrbiSearchLabels }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const target = targets[pathname] ?? targets["/app"];
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(pathname === "/app/jobs" ? (params.get("q") ?? "") : "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchPreviewItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const words = query.trim();
  const filterCount =
    pathname === "/app/jobs" ? jobFilterKeys.filter((key) => params.get(key)).length : 0;

  // A few results while typing, a little after the last key.
  useEffect(() => {
    if (words.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/recherche/apercu?q=${encodeURIComponent(words)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { items: [] }))
        .then((data: { items: SearchPreviewItem[] }) => setItems(data.items))
        .catch(() => {});
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [words]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const shown = words.length >= 2 ? items : [];
  const hasPanel = open && (words.length >= 2 || recent.length > 0);
  const panelId = `${id}-panel`;

  return (
    <div ref={root} className="relative z-40">
      {hasPanel && <div aria-hidden className="fixed inset-0 -z-10 bg-nuit/35" />}
      <div className="flex items-center gap-2.5">
        <form action={target.action} role="search" className="min-w-0 flex-1">
          <label htmlFor={`${id}-q`} className="sr-only">
            {labels.label}
          </label>
          <div className="jm-search-field flex h-[52px] items-center gap-2.5 rounded-[18px] px-3.5 focus-within:shadow-[0_0_0_2px_var(--jm-search-ring),0_8px_22px_-12px_rgb(15_63_55/0.28)]">
            <Icon name="recherche" className="size-[18px] shrink-0 opacity-70" />
            <input
              id={`${id}-q`}
              name="q"
              type="search"
              value={query}
              autoComplete="off"
              enterKeyHint="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={hasPanel}
              aria-controls={panelId}
              placeholder={labels.placeholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setRecent(recentSearches().slice(0, 3));
                setOpen(true);
              }}
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[13.5px] placeholder:text-current placeholder:opacity-70 [&::-webkit-search-cancel-button]:hidden"
            />
            <span aria-hidden className="jm-orbi-dot size-6 shrink-0 rounded-full" />
          </div>
        </form>
        <Link
          href={target.filters}
          aria-label={
            filterCount > 0
              ? (filterCount === 1 ? labels.filtersCount.one : labels.filtersCount.other).replace(
                  "#",
                  String(filterCount),
                )
              : labels.filters
          }
          onClick={(event) => {
            const panel = document.getElementById("jf-all");
            if (!(panel instanceof HTMLDetailsElement)) return;
            event.preventDefault();
            panel.open = true;
            panel.querySelector("summary")?.focus();
          }}
          className="jm-filter-button relative grid size-[52px] shrink-0 place-items-center rounded-[18px]"
        >
          <Icon name="filtre" className="size-[22px]" />
          {filterCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-[5px] -right-[5px] grid size-[19px] place-items-center rounded-full bg-lime text-[11px] font-bold text-sapin ring-2 ring-creme"
            >
              {filterCount}
            </span>
          )}
        </Link>
      </div>

      <div
        id={panelId}
        role="region"
        aria-label={labels.results}
        hidden={!hasPanel}
        className="absolute inset-x-0 top-[calc(100%+12px)] flex flex-col gap-1 rounded-[24px] bg-blanc p-2 text-sapin shadow-menu"
      >
        <div
          aria-disabled="true"
          className="jm-ai-surface flex items-center gap-3 rounded-[18px] px-3.5 py-3 text-blanc"
        >
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-sapin"
          >
            <Icon name="intelligence" className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">{labels.askTitle}</span>
            <span className="truncate text-[13px] text-blanc/75">{labels.askSoon}</span>
          </span>
        </div>
        {shown.length > 0 && (
          <ul className="flex flex-col">
            {shown.map((item) => (
              <li key={item.href} className="border-b border-sapin/6 last:border-0">
                <Link
                  href={item.href}
                  className="flex min-h-12 items-center gap-3 rounded-[12px] px-2 text-[15px] hover:bg-creme"
                >
                  <Icon name={kindIcons[item.kind]} className="size-5 shrink-0 text-ardoise" />
                  <span className="min-w-0 flex-1 truncate">{highlight(item.title, words)}</span>
                  <span className="shrink-0 rounded-pill bg-[#F6F3EE] px-2.5 py-1 text-[12.5px] text-ardoise">
                    {labels.kind[item.kind]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {recent.length > 0 && (
          <ul aria-label={labels.recent} className="flex flex-wrap gap-2 px-1 pt-2">
            {recent.map((item) => (
              <li key={item}>
                <Link
                  href={`/app/recherche?q=${encodeURIComponent(item)}`}
                  className="flex h-10 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[14px] shadow-douce"
                >
                  <Icon name="horloge" className="size-4 shrink-0" />
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={words ? `/app/recherche?q=${encodeURIComponent(words)}` : "/app/recherche"}
          className={cx(
            "flex min-h-11 items-center justify-center gap-1 text-[15px] font-semibold text-feuille-fonce",
          )}
        >
          {labels.seeAll}
          <Icon name="chev-r" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
