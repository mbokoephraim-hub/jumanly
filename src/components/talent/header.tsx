"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { TOP_BAR_SLOT_ID } from "@/lib/top-bar";
import { cx } from "@/lib/cx";
import { OFFER_FILTERS_ID, offerFilterKeys } from "@/lib/offer-filters";
import { showToast } from "@/components/motion/toaster";
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

export function plural(forms: { zero: string; one: string; other: string }, count: number) {
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

/** Destinations that draw their own head on a computer or a tablet (title, lead, search). */
const webHead = ["/app/learn"];

/** Pages whose search sits under the big title, and where it searches. */
const searches: Record<string, { action: string; filters?: string }> = {
  "/app/jobs": { action: "/app/jobs", filters: "/app/jobs" },
  "/app/learn": { action: "/app/learn/rechercher", filters: "/app/learn/rechercher" },
};

/**
 * Head of the talent space (planche Fondations § 5). A destination shows its name in big, the
 * notifications (Lime dot), the messages (Corail counter) and the avatar that opens the account,
 * then the search with its filters. Any other page starts with « Retour » and its title; a page
 * can put its own title and tools there instead (PhoneTitle). Orbi has its own head.
 */
/** Pages that draw their own head: the offer and the screens of planches talent-2 and talent-3. */
export function ownHead(pathname: string) {
  return [
    /^\/app\/jobs\/(?!candidatures$|enregistrees$)[^/]+(\/postuler|\/fiche)?$/,
    /^\/app\/suivi\/(?!entretiens$)[^/]+$/,
    /^\/app\/career\/entretiens\/[^/]+$/,
    /^\/app\/messages(\/[^/]+)?$/,
    /^\/app\/notifications$/,
    // Lot 5: every page of Apprendre under its home.
    /^\/app\/learn\/.+/,
    // Lot 6: Compte, Connexions, Mon profil and its screens.
    /^\/app\/compte(\/connexions|\/aide)?$/,
    /^\/app\/profil(\/(modifier|experience|competence|recherche|projet|apercu))?$/,
    // Lot 6b: faire le point, the diagnostic, the plan and the practice (planche talent-4 § 5).
    /^\/app\/profil\/point$/,
    /^\/app\/career\/(diagnostic|plan|entretiens)(\/.*)?$/,
    // Lot 6c: CV et documents, LinkedIn, the letters, the CV studio and the CV import.
    /^\/app\/career\/(cv|linkedin|documents)(\/.*)?$/,
    /^\/app\/profil\/import$/,
    // Lot 7: subscription, plans, payment, invoices, settings, search and the tester tool.
    /^\/app\/(abonnement|parametres)(\/.*)?$/,
    /^\/app\/(recherche|testeur|acces-refuse)$/,
    /^\/app\/invitation\/[^/]+$/,
  ].some((pattern) => pattern.test(pathname));
}

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
  // On a computer or a tablet the bell is in the top bar of the frame, which keeps it fresh.
  const count = useUnread(unread, PHONE);
  // Orbi and the first connection draw their own head.
  if (pathname === "/app/orbi" || pathname === "/app/bienvenue") return null;
  // An offer opens on its banner, with its own buttons over it (planche talent-1 § 3); the screens
  // of planche talent-2 draw their own head (`FlowHead`).
  if (ownHead(pathname)) return null;
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
    // Apprendre draws its own head on a computer or a tablet (planche web talent-3 § 1).
    <header className={cx("t-colonne", webHead.includes(pathname) && "t-mob")}>
      <div className="t-tete">
        {/* The page keeps its own heading for screen readers; this is its visible name. */}
        <p aria-hidden className="t-h1">
          {tab}
        </p>
        <Link
          href="/app/notifications"
          aria-label={plural(labels.notifications, count)}
          className="t-bi t-mob"
        >
          <TalentIcon name="notification" />
          {count > 0 && <i aria-hidden className="t-pastille" />}
        </Link>
        <Link
          href="/app/messages"
          aria-label={plural(labels.messages, unreadMessages)}
          className="t-bi t-mob"
        >
          <TalentIcon name="message" />
          {unreadMessages > 0 && (
            <b aria-hidden className="t-cpt">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </b>
          )}
        </Link>
        <Link href="/app/compte" aria-label={labels.account} className="t-av t-mob">
          {avatar}
        </Link>
      </div>
      {search && (
        <div className={cx("t-rech-zone", pathname === "/app/jobs" && "t-rech-of")}>
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
  return <SearchBar {...props} query={params.get("q") ?? ""} params={params.toString()} />;
}

/**
 * The search of a destination (planche Fondations § 5): a glass pill, the filters on the right.
 * Offres also draws it at the head of its list on a computer (planche web talent-1 § 2).
 */
export function SearchBar({
  action,
  filters,
  labels,
  pathname,
  query = "",
  params = "",
}: {
  action: string;
  filters?: string;
  labels: HeaderLabels["search"];
  pathname: string;
  query?: string;
  /** The current query string: the filters keep it, and count the filters already on. */
  params?: string;
}) {
  const current = new URLSearchParams(params);
  const active = offerFilterKeys.filter((key) => current.get(key)).length;
  current.set("filtres", "1");
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
          href={`${filters}?${current.toString()}`}
          aria-label={active > 0 ? `${labels.filters} · ${active}` : labels.filters}
          aria-haspopup="dialog"
          className={cx("t-f t-press")}
          onClick={(event) => {
            // On Offres the sheet is already in the page: it opens at once.
            const sheet = document.getElementById(OFFER_FILTERS_ID);
            if (sheet instanceof HTMLDialogElement) {
              event.preventDefault();
              if (!sheet.open) sheet.showModal();
            }
          }}
        >
          <TalentIcon name="filtres" size="s" />
          {active > 0 && <b aria-hidden>{active}</b>}
        </Link>
      )}
    </form>
  );
}

/** Widths where the head of a page carries the bell (the web frame has its own top bar). */
const PHONE = "(max-width: 767.98px)";

/**
 * Unread notifications, kept fresh while the page stays open (every minute, visible tab only).
 * `media`: only while this media query matches, so the phone head and the web top bar never both
 * ask (nor both show the toast of a new notification).
 */
export function useUnread(initial: number, media?: string) {
  const [count, setCount] = useState(initial);
  const [known, setKnown] = useState(initial);
  if (known !== initial) {
    setKnown(initial);
    setCount(initial);
  }
  // Newest notification already known: anything newer has just arrived (an important one says so
  // in a toast, docs/experience-animee § 4).
  const seen = useRef<string | null>(null);
  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      if (media && !window.matchMedia(media).matches) return;
      const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const data = (await response.json()) as { unread: number; items: ArrivedItem[] };
      if (seen.current !== null) {
        const arrived = data.items.filter(
          (item) => item.unread && item.important && item.createdAt > seen.current!,
        );
        for (const item of arrived.slice(0, 2))
          showToast({ message: item.text, href: item.href ?? undefined, tone: "info" });
      }
      const newest = data.items[0]?.createdAt ?? "";
      if (seen.current === null || newest > seen.current) seen.current = newest;
      setCount(data.unread);
    };
    const first = window.setTimeout(load, 1500);
    const timer = window.setInterval(load, POLL_MS);
    const onVisible = () => void load();
    document.addEventListener("visibilitychange", onVisible);
    // Marked read from the panel under the bell: the count follows at once.
    window.addEventListener("jm:notifications-lues", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("jm:notifications-lues", onVisible);
    };
  }, [media]);
  return count;
}

type ArrivedItem = {
  text: string;
  href: string | null;
  createdAt: string;
  unread: boolean;
  important: boolean;
};
