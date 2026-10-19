"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { TOP_BAR_SLOT_ID } from "@/lib/top-bar";
import { cx } from "@/lib/cx";
import { BackButton, parentPath, useCountPages } from "./back-button";
import { TalentIcon } from "./icon";

const POLL_MS = 60_000;

export type HeaderLabels = {
  notifications: { zero: string; one: string; other: string };
  messages: { zero: string; one: string; other: string };
  account: string;
  back: string;
  search: {
    label: string;
    placeholder: string;
    placeholderOffers: string;
    placeholderLearn: string;
    filters: string;
  };
  /** Big title of each destination, by path. */
  tabs: Record<string, string>;
  /** Title of the other pages: the longest path that contains the page wins. */
  titles: Record<string, string>;
};

function plural(forms: { zero: string; one: string; other: string }, count: number) {
  if (count === 0) return forms.zero;
  if (count === 1) return forms.one;
  return forms.other.replace("#", String(count));
}

/** The name of the page: the longest path in `titles` that contains it. */
function titleOf(pathname: string, titles: Record<string, string>) {
  let best = "";
  for (const path of Object.keys(titles)) {
    const inside = pathname === path || pathname.startsWith(`${path}/`);
    if (inside && path.length > best.length) best = path;
  }
  return best ? titles[best] : null;
}

/** Pages whose search sits under the big title, and where it searches. */
const searches: Record<string, { action: string; filters?: string }> = {
  "/app": { action: "/app/recherche", filters: "/app/jobs?filtres=1" },
  "/app/jobs": { action: "/app/jobs", filters: "/app/jobs?filtres=1" },
  "/app/learn": { action: "/app/learn" },
};

/**
 * Head of the talent space (planche Fondations § 5). A destination shows its name in big, the
 * notifications (Lime dot), the messages (Corail counter) and the avatar that opens the account,
 * then the search with its filters. Any other page starts with « Retour » and its title; a page
 * can put its own title and tools there instead (PhoneTitle). Orbi has its own head.
 */
export function TalentHeader({
  labels,
  unread,
  unreadMessages,
  avatar,
}: {
  labels: HeaderLabels;
  unread: number;
  unreadMessages: number;
  avatar: ReactNode;
}) {
  useCountPages();
  const pathname = usePathname();
  const count = useUnread(unread);
  if (pathname === "/app/orbi") return null;
  const tab = labels.tabs[pathname];

  if (!tab) {
    const title = titleOf(pathname, labels.titles);
    return (
      <header className="t-colonne">
        <div className="t-tete t-sec group/top">
          <div id={TOP_BAR_SLOT_ID} className="contents" />
          <div className="flex min-w-0 flex-1 items-center gap-2 group-has-[[data-top-override][data-active]]/top:hidden">
            <BackButton fallback={parentPath(pathname)} label={labels.back} />
            {title && <p className="t-h1">{title}</p>}
          </div>
        </div>
      </header>
    );
  }

  const search = searches[pathname];
  return (
    <header className="t-colonne">
      <div className="t-tete">
        {/* The page keeps its own heading for screen readers; this is its visible name. */}
        <p aria-hidden className="t-h1">
          {tab}
        </p>
        <Link
          href="/app/notifications"
          aria-label={plural(labels.notifications, count)}
          className="t-bi"
        >
          <TalentIcon name="notification" />
          {count > 0 && <i aria-hidden className="t-pastille" />}
        </Link>
        <Link
          href="/app/messages"
          aria-label={plural(labels.messages, unreadMessages)}
          className="t-bi"
        >
          <TalentIcon name="message" />
          {unreadMessages > 0 && (
            <b aria-hidden className="t-cpt">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </b>
          )}
        </Link>
        <Link href="/app/compte" aria-label={labels.account} className="t-av">
          {avatar}
        </Link>
      </div>
      {search && (
        <div className="t-rech-zone">
          <Suspense fallback={<SearchBar {...search} labels={labels.search} pathname={pathname} />}>
            <SearchWithQuery {...search} labels={labels.search} pathname={pathname} />
          </Suspense>
        </div>
      )}
    </header>
  );
}

function SearchWithQuery(props: Parameters<typeof SearchBar>[0]) {
  const params = useSearchParams();
  return <SearchBar {...props} query={params.get("q") ?? ""} />;
}

/** The search of a destination (planche Fondations § 5): a glass pill, the filters on the right. */
function SearchBar({
  action,
  filters,
  labels,
  pathname,
  query = "",
}: {
  action: string;
  filters?: string;
  labels: HeaderLabels["search"];
  pathname: string;
  query?: string;
}) {
  const placeholder =
    pathname === "/app/jobs"
      ? labels.placeholderOffers
      : pathname === "/app/learn"
        ? labels.placeholderLearn
        : labels.placeholder;
  return (
    <form action={action} method="get" role="search" className="t-rech t-verre">
      <TalentIcon name="recherche" size="s" />
      <input
        key={query}
        name="q"
        type="search"
        defaultValue={query}
        aria-label={labels.label}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
      />
      {filters && (
        <Link
          href={query ? `${filters}&q=${encodeURIComponent(query)}` : filters}
          aria-label={labels.filters}
          className={cx("t-f t-press")}
        >
          <TalentIcon name="filtres" size="s" />
        </Link>
      )}
    </form>
  );
}

/** Unread notifications, kept fresh while the page stays open (every minute, visible tab only). */
function useUnread(initial: number) {
  const [count, setCount] = useState(initial);
  const [known, setKnown] = useState(initial);
  if (known !== initial) {
    setKnown(initial);
    setCount(initial);
  }
  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const data = (await response.json()) as { unread: number };
      setCount(data.unread);
    };
    const timer = window.setInterval(load, POLL_MS);
    const onVisible = () => void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return count;
}
