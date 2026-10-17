"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/brand/icon";
import { CONSENT_COOKIE, parseConsent } from "@/lib/consent";

const KEY = "jm:recherches";
const MAX = 6;

function allowed() {
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(entry?.slice(CONSENT_COOKIE.length + 1))?.preferences === true;
}

function read(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((item) => typeof item === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** The recent searches of this browser, empty without the « preferences » consent. */
export function recentSearches(): string[] {
  return allowed() ? read() : [];
}

/**
 * Recent searches (screen 18), kept in this browser only and only with the « preferences » cookie
 * consent. The current words are remembered when they are searched.
 */
export function RecentSearches({
  query,
  labels,
}: {
  query: string;
  labels: { title: string; clear: string };
}) {
  const [items, setItems] = useState<string[] | null>(null);
  useEffect(() => {
    if (!allowed()) return;
    const list = read();
    const next = query ? [query, ...list.filter((item) => item !== query)].slice(0, MAX) : list;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked: the list simply stays empty.
    }
    // Reading the browser's storage is the external system this effect syncs with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(next.filter((item) => item !== query));
  }, [query]);

  if (!items || items.length === 0) return null;
  return (
    <section aria-labelledby="recherches-recentes" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="recherches-recentes"
          className="text-[14px] font-semibold tracking-[0.06em] text-ardoise uppercase"
        >
          {labels.title}
        </h2>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(KEY);
            } catch {}
            setItems([]);
          }}
          className="text-[15px] font-semibold text-feuille-fonce hover:underline"
        >
          {labels.clear}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item}>
            <Link
              href={`/app/recherche?q=${encodeURIComponent(item)}`}
              className="flex h-11 items-center gap-2 rounded-pill bg-blanc px-4 text-[15px] shadow-douce"
            >
              <Icon name="horloge" className="size-4 shrink-0" />
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
