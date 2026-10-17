"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";
import { hidesTalentTabBar } from "@/config/navigation";
import { cx } from "@/lib/cx";

export type Tab = { key: string; href: string; icon: IconName; label: string };

function isActive(pathname: string, href: string) {
  // « Pour moi » is the home: only its own page, not the whole signed-in space.
  return href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** The J of the brand (ressources/logos, pictogramme): white stroke, Lime dot. */
function BrandJ() {
  return (
    <svg viewBox="23.5 19.5 58 78" width="19" height="26" aria-hidden className="ml-1">
      <path
        d="M70 55 V70 A19 19 0 0 1 33.15 76.50"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <circle cx="70" cy="31" r="11.5" fill="#A6F26B" />
    </svg>
  );
}

/**
 * Bottom bar of the talent space on a phone (docs/ux-mobile-talent V6 § B2, V7 § B2, screen 03):
 * five destinations on frosted glass, Pour moi in the middle in a raised 58 px round, Compte with
 * the person's photo or initials. The Lime pill slides to the tab touched and its icon bounces
 * (colour only in reduced motion). The badge of Suivi is the real number of actions to take. The
 * bar steps aside on screens that have their own fixed action bar (`hidesTalentTabBar`).
 */
export function TabBar({
  label,
  tabs,
  center,
  account,
  badge,
}: {
  label: string;
  tabs: readonly Tab[];
  /** Key of the raised tab (Pour moi). */
  center: string;
  /** Key and picture of the account tab (photo or initials). */
  account: { key: string; avatar: ReactNode };
  /** Badge of one tab: its count and what screen readers hear. */
  badge?: { key: string; count: number; label: string };
}) {
  const pathname = usePathname();
  if (hidesTalentTabBar(pathname)) return null;
  const activeIndex = tabs.findIndex((tab) => isActive(pathname, tab.href));
  const pillIndex = tabs[activeIndex]?.key === center ? -1 : activeIndex;
  return (
    <nav
      aria-label={label}
      className="jm-tabbar fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-20 rounded-[26px] p-1.5 md:hidden"
    >
      <ul className="relative grid grid-cols-5 gap-0.5">
        {/* The Lime pill: one element that slides from tab to tab. */}
        <li
          aria-hidden
          className={cx(
            "jm-tab-pill pointer-events-none absolute inset-y-0 left-0 w-[calc((100%-8px)/5)] rounded-[20px] bg-lime",
            pillIndex < 0 && "opacity-0",
          )}
          style={{ transform: `translateX(calc(${Math.max(pillIndex, 0)} * (100% + 2px)))` }}
        />
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          const count = badge?.key === tab.key ? badge.count : 0;
          const raised = tab.key === center;
          return (
            <li key={tab.key} className="relative">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                onClick={() => navigator.vibrate?.(8)}
                className={cx(
                  "jm-tab relative flex min-h-14 flex-col items-center gap-[3px] px-0.5 text-[10.5px] leading-none whitespace-nowrap",
                  raised ? "justify-end pb-1" : "justify-center",
                  active ? "font-semibold text-sapin" : "font-medium",
                  raised && active && "font-bold",
                )}
              >
                {raised ? (
                  <span
                    aria-hidden
                    className={cx(
                      "jm-tab-center absolute -top-[26px] left-1/2 grid size-[58px] -translate-x-1/2 place-items-center rounded-full",
                      active && "jm-tab-center-on",
                    )}
                  >
                    <BrandJ />
                  </span>
                ) : tab.key === account.key ? (
                  <span
                    className={cx(
                      "jm-tab-icon grid size-6 place-items-center overflow-hidden rounded-full",
                      active && "ring-2 ring-sapin",
                    )}
                  >
                    {account.avatar}
                  </span>
                ) : (
                  <span className="jm-tab-icon flex [&_svg]:size-[22px]">
                    <Icon name={tab.icon} />
                  </span>
                )}
                <span className="max-w-full truncate">{tab.label}</span>
                {count > 0 && (
                  <>
                    <span
                      aria-hidden
                      className="absolute top-1.5 left-[calc(50%+6px)] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-sapin ring-2 ring-[#156b59]"
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                    <span className="sr-only">{badge?.label}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
