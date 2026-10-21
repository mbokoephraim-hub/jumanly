"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PHONE_TABS, TAB_ROOTS, rootTab, tabOf, type PhoneTab } from "@/lib/phone-tabs";
import { PhoneIcon } from "./icon";

/**
 * The bottom bar (brief § 3): five icons without names, Fil · Explorer · Carrière · Formation ·
 * Messages, a lime dot under the active one. Shown on the first screen of each tab; a page opened
 * from a tab covers it. Touching the tab already shown brings its list back to the top.
 */
export function PhoneNav({ labels, aria }: { labels: Record<PhoneTab, string>; aria: string }) {
  const pathname = usePathname();
  const root = rootTab(pathname);
  const current = tabOf(pathname);
  return (
    <nav className="nb-nav" aria-label={aria} hidden={root === null}>
      {PHONE_TABS.map((tab) => {
        const active = tab === current;
        return (
          <Link
            key={tab}
            href={TAB_ROOTS[tab]}
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
          </Link>
        );
      })}
    </nav>
  );
}
