"use client";

import { useEffect } from "react";

/**
 * On a computer or a tablet, the folded sections of a page open at once (planche web recruteur-1
 * § 4: the content of an offer is read in its two columns); on a phone they stay folded, as in
 * the mobile lot. Each can still be folded by hand.
 */
export function OpenOnWide({ selector }: { selector: string }) {
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    for (const node of document.querySelectorAll<HTMLDetailsElement>(selector)) node.open = true;
  }, [selector]);
  return null;
}
