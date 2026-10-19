"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Widths where a list and its detail sit side by side. */
const SIDE_BY_SIDE = {
  /** Computer (≥ 1200 px): Suivi. */
  computer: "(min-width: 1200px)",
  /** Tablet and computer (≥ 768 px): Messages. */
  web: "(min-width: 768px)",
} as const;

/**
 * Opens the first item of a list beside it on a large screen (planche web talent-2: Suivi and
 * Messages open on the first one). The address takes the choice (`replace`: Retour leaves the
 * page instead of coming back here). On a phone nothing happens: the list stays alone, and the
 * detail is never rendered for nothing.
 */
export function AutoSelect({
  href,
  from,
}: {
  href: string | null;
  /** From which width the list and the detail sit side by side. */
  from: keyof typeof SIDE_BY_SIDE;
}) {
  const router = useRouter();
  useEffect(() => {
    if (href && window.matchMedia(SIDE_BY_SIDE[from]).matches)
      router.replace(href, { scroll: false });
  }, [href, from, router]);
  return null;
}

/**
 * While mounted, the big title of the destination is hidden under 1200 px: Suivi opened on one
 * application (`/app/suivi?id=`) on a phone or a tablet shows that application with its own head,
 * like `/app/suivi/[id]`.
 */
export function DetailOnly() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.detailSeul = "";
    return () => {
      delete root.dataset.detailSeul;
    };
  }, []);
  return null;
}
