"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hidesTalentTabBar, talentTabOf, talentTabs } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { TalentIcon } from "./icon";
import { OrbiMark, type OrbiState } from "./orbi-mark";

/** Event that sets the state of Orbi's mark in the bar (« reflechit » while Orbi works). */
export const ORBI_STATE_EVENT = "jm-orbi-state";

export function setOrbiState(state: OrbiState) {
  window.dispatchEvent(new CustomEvent<OrbiState>(ORBI_STATE_EVENT, { detail: state }));
}

/**
 * Bottom bar of the talent space (planche Fondations § 1 and § 4): a floating glass pill, Orbi's
 * round overflowing in the middle. The tab lights up on the tap itself, before the page arrives,
 * so a tap always answers at once; Orbi's satellite turns while its page loads.
 */
export function TalentBottomBar({
  labels,
  badge,
}: {
  labels: Record<(typeof talentTabs)[number]["key"], string> & { aria: string; badge: string };
  /** Actions to take in Suivi (Corail counter). */
  badge: number;
}) {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);
  const [orbi, setOrbi] = useState<OrbiState>("repos");

  // The page has arrived: the bar follows the address again.
  const [shown, setShown] = useState(pathname);
  if (shown !== pathname) {
    setShown(pathname);
    setPending(null);
  }

  useEffect(() => {
    const onState = (event: Event) => setOrbi((event as CustomEvent<OrbiState>).detail);
    window.addEventListener(ORBI_STATE_EVENT, onState);
    return () => window.removeEventListener(ORBI_STATE_EVENT, onState);
  }, []);

  if (hidesTalentTabBar(pathname)) return null;
  const current = pending ?? talentTabOf(pathname)?.href ?? null;

  return (
    <div className="t-nav-z t-barre-bas">
      <nav aria-label={labels.aria}>
        <ul className="t-nav">
          {talentTabs.map((tab) => {
            const on = current === tab.href;
            const centre = tab.key === "orbi";
            return (
              <li key={tab.key} className={cx("contents", centre && "t-centre-li")}>
                <Link
                  href={tab.href}
                  prefetch
                  aria-current={on && !pending ? "page" : undefined}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                    if (tab.href !== pathname) setPending(tab.href);
                  }}
                  className={cx("t-press", on && "t-on", centre && "t-centre")}
                >
                  {centre ? (
                    <span className="t-rond">
                      <OrbiMark size={48} state={pending === tab.href ? "reflechit" : orbi} />
                    </span>
                  ) : (
                    <span className={cx(tab.key === "suivi" && badge > 0 && "t-badge")}>
                      <TalentIcon name={tab.icon} on={on} />
                      {tab.key === "suivi" && badge > 0 && (
                        <b aria-hidden>{badge > 9 ? "9+" : badge}</b>
                      )}
                    </span>
                  )}
                  <span>{labels[tab.key]}</span>
                  {tab.key === "suivi" && badge > 0 && (
                    <span className="sr-only">{labels.badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
