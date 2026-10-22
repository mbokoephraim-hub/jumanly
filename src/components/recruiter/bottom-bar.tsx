"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hidesRecruiterTabBar, recruiterTabOf, recruiterTabs } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark, type OrbiState } from "@/components/talent/orbi-mark";

/** Event that sets the state of Orbi's mark in the bar (« reflechit » while Orbi works). */
const ORBI_STATE_EVENT = "jm-orbi-state";

/**
 * Bottom bar of the recruiter space (brief recruteur § 1, planche recruteur-1 `nav`): the same
 * floating glass pill as the talent space, Orbi's round in the middle, the unread conversations
 * on Messages. The tab lights up on the tap itself, before the page arrives.
 */
export function RecruiterBottomBar({
  labels,
  unreadMessages,
}: {
  labels: Record<(typeof recruiterTabs)[number]["key"], string> & {
    aria: string;
    messagesBadge: string;
  };
  /** Conversations with an unread message (Corail counter of Messages). */
  unreadMessages: number;
}) {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);
  const [orbi, setOrbi] = useState<OrbiState>("repos");

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

  if (hidesRecruiterTabBar(pathname)) return null;
  const current = pending ?? recruiterTabOf(pathname)?.href ?? null;

  return (
    <div className="t-nav-z t-barre-bas">
      <nav aria-label={labels.aria}>
        <ul className="t-nav">
          {recruiterTabs.map((tab) => {
            const on = current === tab.href;
            const centre = tab.key === "orbi";
            const badge = tab.key === "messages" && unreadMessages > 0;
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
                    <span className={cx(badge && "t-badge")}>
                      <TalentIcon name={tab.icon} on={on} />
                      {badge && <b aria-hidden>{unreadMessages > 9 ? "9+" : unreadMessages}</b>}
                    </span>
                  )}
                  <span>{labels[tab.key]}</span>
                  {badge && <span className="sr-only">{labels.messagesBadge}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
