"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

/**
 * The bottom bar (brief § 3): five icons without names, Fil · Explorer · Carrière · Formation ·
 * Messages, a lime dot under the active one. Shown on the first screen of each tab; a page opened
 * from a tab covers it, except the pages of a company or a person, which keep it above them.
 * Touching the tab already shown brings its list back to the top.
 */
export function PhoneNav({
  labels,
  aria,
  set = "talent",
  badges,
}: {
  labels: Partial<Record<PhoneTab, string>>;
  aria: string;
  set?: TabSetName;
  /** The recruiter's bar (planche Recruteur-offres `nav`): a lime count, or a lime dot. */
  badges?: Partial<Record<PhoneTab, { count?: number; dot?: boolean }>>;
}) {
  const pathname = usePathname();
  const root = rootTab(pathname, set);
  const current = tabOf(pathname, set);
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
        const badge = badges?.[tab];
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
              if (root !== tab) return;
              event.preventDefault();
              const layer =
                document.querySelector(`[data-onglet-couche="${tab}"]`) ??
                document.getElementById("content");
              layer?.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <PhoneIcon name={tab} strong={active} />
            <span className="nb-pt" aria-hidden />
            {badge?.count ? (
              <span className="nb-nav-compte" aria-hidden>
                {badge.count > 99 ? "99+" : badge.count}
              </span>
            ) : badge?.dot ? (
              <span className="nb-nav-point" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
