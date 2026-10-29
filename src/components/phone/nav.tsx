"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  keepsBar,
  rootOf,
  rootTab,
  tabOf,
  tabsOf,
  type PhoneTab,
  type TabSetName,
} from "@/lib/phone-tabs";
import { REFRESHED_EVENT } from "./fresh";
import { PhoneIcon } from "./icon";

/** The tab's title in the browser, as the server last gave it for that address. */
const titles = new Map<string, string>();

/**
 * Talent tabs: the five are drawn by the layout and their first screens are empty pages
 * (`return null` on a phone). Going from one to another therefore needs nothing from the server:
 * the address changes on the phone itself, the tab already there shows at once, even offline
 * (Ephraïm, 29/10/2026: « passer du Fil à Explorer prend quelques secondes »). The recruiter's tabs
 * are real pages, so they keep the usual navigation.
 */
function switchTab(from: string, to: string, name: string | undefined) {
  titles.set(from, document.title);
  window.history.pushState(null, "", to);
  const brand = document.title.includes(" · ") ? document.title.split(" · ").pop() : null;
  const title = titles.get(to) ?? (name && brand ? `${name} · ${brand}` : null);
  if (title) document.title = title;
}

/** The menu asks for its counts every minute while the app is in front. */
const COUNTS_MS = 60_000;
/** Above this, the count reads « 5+ » (Ephraïm, 29/10/2026). */
const COUNT_MAX = 5;
/** The tabs whose count is what is new since the person's last visit, remembered by the phone. */
const SINCE_TABS: Record<TabSetName, PhoneTab[]> = {
  talent: ["fil", "explorer", "carriere"],
  recruteur: ["fil"],
};

function seenKey(set: TabSetName, tab: PhoneTab) {
  return `jm:onglet-vu:${set}:${tab}`;
}
function readSeen(set: TabSetName, tab: PhoneTab) {
  try {
    return window.localStorage.getItem(seenKey(set, tab));
  } catch {
    return null;
  }
}
function writeSeen(set: TabSetName, tab: PhoneTab, when: string) {
  try {
    window.localStorage.setItem(seenKey(set, tab), when);
  } catch {
    // Private browsing: the count simply starts again from now.
  }
}

/**
 * The live counts of the menu: what the server gave with the page, then asked again every minute,
 * when the app comes back, after a refresh and on each change of screen. Being on a tab marks it
 * seen (its count goes); a phone that never saw a tab starts counting from now.
 */
function useTabCounts(
  initial: Partial<Record<PhoneTab, number>> | undefined,
  set: TabSetName,
  current: PhoneTab | null,
) {
  const [counts, setCounts] = useState<Partial<Record<PhoneTab, number>>>(initial ?? {});
  const [known, setKnown] = useState(initial);
  if (known !== initial) {
    setKnown(initial);
    setCounts((now) => ({ ...now, ...initial }));
  }
  const tab = useRef(current);
  const pathname = usePathname();
  const load = useRef(async () => {});
  useEffect(() => {
    tab.current = current;
    load.current = async () => {
      if (document.visibilityState !== "visible") return;
      const now = new Date().toISOString();
      const params = new URLSearchParams();
      for (const name of SINCE_TABS[set]) {
        const seen = readSeen(set, name);
        if (!seen || name === tab.current) writeSeen(set, name, now);
        else params.set(name, seen);
      }
      const response = await fetch(`/api/onglets/compteurs?${params}`, {
        cache: "no-store",
      }).catch(() => null);
      if (!response?.ok) return;
      const data = (await response.json()) as Partial<Record<PhoneTab, number>>;
      setCounts(data);
    };
  }, [current, set]);

  // Each screen shown: the tab left keeps counting from now, the counts are asked again.
  useEffect(() => {
    if (current && SINCE_TABS[set].includes(current))
      writeSeen(set, current, new Date().toISOString());
    const soon = window.setTimeout(() => void load.current(), 800);
    return () => window.clearTimeout(soon);
  }, [pathname, current, set]);

  useEffect(() => {
    const ask = () => void load.current();
    const timer = window.setInterval(ask, COUNTS_MS);
    document.addEventListener("visibilitychange", ask);
    window.addEventListener(REFRESHED_EVENT, ask);
    // A conversation or a notification read: the counts follow.
    window.addEventListener("jm:notifications-lues", ask);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", ask);
      window.removeEventListener(REFRESHED_EVENT, ask);
      window.removeEventListener("jm:notifications-lues", ask);
    };
  }, []);
  // The tab shown is seen: its news are no longer counted.
  return current && SINCE_TABS[set].includes(current) ? { ...counts, [current]: 0 } : counts;
}

/**
 * The pill menu (docs/fil-menu-publication, § 1): a floating bar, round icons for the inactive
 * tabs, the active one stretched in Lime with its name (Fil · Explorer · Carrière · Hub · Chat for
 * the talent; Fil · Offres · Candidatures · Talents · Chat for the recruiter). Every tab stays in
 * the DOM so the pill folds and unfolds from one tab to the next. Shown on the first screen of
 * each tab; a page opened from a tab covers it, except the pages of a company or a person, which
 * keep it above them. Touching the tab already shown brings its list back to the top.
 */
export function PhoneNav({
  names,
  aria,
  set = "talent",
  badges,
}: {
  /** The names written in the active pill. */
  names: Partial<Record<PhoneTab, string>>;
  aria: string;
  set?: TabSetName;
  /**
   * Unread conversations, new applications, new posts, offers and news of the applications: a
   * lime count on the icon (« 5+ » above five), gone on the active tab.
   */
  badges?: Partial<Record<PhoneTab, number>>;
}) {
  const t = useTranslations("phone.nav");
  const tRh = useTranslations("phoneRh.nav");
  const pathname = usePathname();
  const root = rootTab(pathname, set);
  // The pill moves under the finger at once, before the new page arrives.
  const [pressed, setPressed] = useState<{ tab: PhoneTab; from: string } | null>(null);
  const current = pressed?.from === pathname ? pressed.tab : tabOf(pathname, set);
  const above = root === null && keepsBar(pathname, set);
  const counts = useTabCounts(badges, set, tabOf(pathname, set));
  // The accessible name says the count (« Chat, 3 conversations non lues »).
  const label = (tab: PhoneTab, count: number) => {
    if (!count) return names[tab];
    if (tab === "messages")
      return set === "recruteur"
        ? tRh("messagesUnread", { count })
        : t("messagesUnread", { count });
    if (tab === "candidatures") return tRh("candidaturesNew", { count });
    if (tab === "fil")
      return set === "recruteur" ? tRh("filNew", { count }) : t("filNew", { count });
    if (tab === "explorer") return t("explorerNew", { count });
    if (tab === "carriere") return t("carriereNew", { count });
    return names[tab];
  };
  return (
    <nav
      className="nb-nav"
      aria-label={aria}
      hidden={root === null && !above}
      data-dessus={above ? "" : undefined}
    >
      {tabsOf(set).map((tab) => {
        const active = tab === current;
        const count = counts[tab] ?? 0;
        return (
          <Link
            key={tab}
            href={rootOf(tab, set)}
            prefetch
            scroll={false}
            data-onglet={tab}
            aria-label={label(tab, count)}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (root !== tab) {
                // From the first screen of a talent tab, the tab touched is shown at once.
                if (set === "talent" && root !== null && !event.metaKey && !event.ctrlKey) {
                  event.preventDefault();
                  switchTab(pathname, rootOf(tab, set), names[tab]);
                  return;
                }
                setPressed({ tab, from: pathname });
                return;
              }
              event.preventDefault();
              const layer =
                document.querySelector(`[data-onglet-couche="${tab}"]`) ??
                document.getElementById("content");
              // Already at the top: the tab is read again (the Fil brings its new posts).
              if (layer && layer.scrollTop <= 0)
                window.dispatchEvent(new CustomEvent("jm:onglet-haut", { detail: { tab } }));
              else layer?.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <PhoneIcon name={tab} size={22} stroke={2} />
            <span className="nb-nav-nom" aria-hidden>
              {names[tab]}
            </span>
            {count ? (
              <span className="nb-nav-compte" aria-hidden>
                {count > COUNT_MAX ? t("many") : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
