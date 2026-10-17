"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { talentTabPaths } from "@/config/navigation";
import { TOP_BAR_SLOT_ID } from "@/lib/top-bar";
import { BackButton, parentPath, useCountPages } from "./back-button";

/** The name of the page: the longest path in `titles` that contains it. */
function titleOf(pathname: string, titles: Record<string, string>) {
  let best = "";
  for (const path of Object.keys(titles)) {
    const inside = path === "/app" ? pathname === path : pathname.startsWith(`${path}/`);
    if ((pathname === path || inside) && path.length > best.length) best = path;
  }
  return best ? titles[best] : null;
}

/**
 * Top of a phone in the talent space (docs/ux-mobile-talent V6 § B3-B4, V7 § B1). On the page
 * background, no logo. A destination shows the Menu button on the left, then « + », Messages and
 * Notifications, and below them its name in big and the search (not on Compte). Any other page
 * starts with « Retour » and its title; a page can put its own title and tools there instead
 * (TopBarOverride).
 */
export function PhoneHeader({
  menu,
  actions,
  search,
  titles,
  backLabel,
}: {
  menu: ReactNode;
  actions: ReactNode;
  search: ReactNode;
  titles: Record<string, string>;
  backLabel: string;
}) {
  useCountPages();
  const pathname = usePathname();
  const tab = talentTabPaths.includes(pathname);
  const title = titleOf(pathname, titles);
  return (
    <header className="jm-phone-head px-4 pt-2 md:hidden">
      <div className="group/top flex min-h-14 items-center gap-2">
        <div id={TOP_BAR_SLOT_ID} className="contents" />
        {tab ? (
          <>
            {menu}
            <div className="ml-auto flex items-center gap-1.5">{actions}</div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3 group-has-[[data-top-override][data-active]]/top:hidden">
            <BackButton fallback={parentPath(pathname)} label={backLabel} />
            {title && (
              <p className="min-w-0 truncate text-[20px] font-semibold tracking-[-0.02em]">
                {title}
              </p>
            )}
          </div>
        )}
      </div>
      {tab && (
        <div className="flex flex-col gap-3 pt-0.5 pb-1.5">
          {/* The page keeps its own heading for screen readers; this is its visible name. */}
          <p
            aria-hidden
            className="jm-page-title text-[30px] leading-[1.05] font-bold tracking-[-0.035em]"
          >
            {title}
          </p>
          {pathname !== "/app/compte" && search}
        </div>
      )}
    </header>
  );
}
