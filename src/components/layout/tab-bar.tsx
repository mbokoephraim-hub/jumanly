"use client";

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

/**
 * Bottom bar of the talent space on a phone (docs/ux-mobile-talent, prompt 2, screen 03): four
 * destinations, icon and label, the current one on Lime, 56 px touch zones, 12 px from the edges
 * above the safe area. The badge of Suivi is the real number of actions to take. It steps aside on
 * screens that have their own fixed action bar (`hidesTalentTabBar`).
 */
export function TabBar({
  label,
  tabs,
  badge,
}: {
  label: string;
  tabs: readonly Tab[];
  /** Badge of one tab: its count and what screen readers hear. */
  badge?: { key: string; count: number; label: string };
}) {
  const pathname = usePathname();
  if (hidesTalentTabBar(pathname)) return null;
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-20 rounded-[26px] bg-sapin bg-(image:--jm-degrade-rail-h) p-1.5 shadow-float md:hidden"
    >
      <ul className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          const count = badge?.key === tab.key ? badge.count : 0;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] px-1 text-[11.5px] leading-none transition-colors [&_svg]:size-[22px]",
                  active
                    ? "jm-nav-active bg-lime font-semibold text-sapin"
                    : "font-medium text-blanc/75 hover:text-blanc",
                )}
              >
                <Icon name={tab.icon} />
                <span className="max-w-full truncate">{tab.label}</span>
                {count > 0 && (
                  <>
                    <span
                      aria-hidden
                      className="absolute top-1.5 left-[calc(50%+6px)] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-sapin ring-2 ring-sapin"
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
