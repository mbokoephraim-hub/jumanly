"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  keepsBar,
  rootOf,
  rootTab,
  tabOf,
  tabsOf,
  type PhoneTab,
  type TabSetName,
} from "@/lib/phone-tabs";
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

/**
 * The pill menu (docs/fil-menu-publication, § 1): a floating bar, round icons for the inactive
 * tabs, the active one stretched in Lime with its name (Fil · Explorer · Carrière · Hub · Chat for
 * the talent; Fil · Offres · Candidatures · Talents · Chat for the recruiter). Every tab stays in
 * the DOM so the pill folds and unfolds from one tab to the next. Shown on the first screen of
 * each tab; a page opened from a tab covers it, except the pages of a company or a person, which
 * keep it above them. Touching the tab already shown brings its list back to the top.
 */
export function PhoneNav({
  labels,
  names,
  aria,
  set = "talent",
  badges,
}: {
  /** Accessible names (with the counts). */
  labels: Partial<Record<PhoneTab, string>>;
  /** The names written in the active pill. */
  names: Partial<Record<PhoneTab, string>>;
  aria: string;
  set?: TabSetName;
  /** Unread conversations, new applications: a lime count on the icon, gone on the active tab. */
  badges?: Partial<Record<PhoneTab, number>>;
}) {
  const pathname = usePathname();
  const root = rootTab(pathname, set);
  // The pill moves under the finger at once, before the new page arrives.
  const [pressed, setPressed] = useState<{ tab: PhoneTab; from: string } | null>(null);
  const current = pressed?.from === pathname ? pressed.tab : tabOf(pathname, set);
  const above = root === null && keepsBar(pathname, set);
  return (
    <nav
      className="nb-nav"
      aria-label={aria}
      hidden={root === null && !above}
      data-dessus={above ? "" : undefined}
    >
      {tabsOf(set).map((tab) => {
        const active = tab === current;
        const count = badges?.[tab];
        return (
          <Link
            key={tab}
            href={rootOf(tab, set)}
            prefetch
            scroll={false}
            data-onglet={tab}
            aria-label={labels[tab]}
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
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
