"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Left of the top bar of a phone (docs/ux-mobile-talent, prompt 2): the logo on « Pour moi », the
 * name of the section everywhere else. `titles` maps a path to its name; the longest one that
 * contains the current page wins.
 */
export function TopTitle({ logo, titles }: { logo: ReactNode; titles: Record<string, string> }) {
  const pathname = usePathname();
  let best = "";
  for (const path of Object.keys(titles)) {
    if ((pathname === path || pathname.startsWith(`${path}/`)) && path.length > best.length) {
      best = path;
    }
  }
  if (!best) return <>{logo}</>;
  return (
    <p className="min-w-0 truncate text-[19px] font-semibold tracking-[-0.02em]">{titles[best]}</p>
  );
}
