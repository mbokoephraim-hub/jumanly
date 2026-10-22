"use client";

import { useEffect } from "react";
import { PHONE_NIGHT } from "@/lib/phone-theme";

/**
 * Keeps the browser bar (and the status bar of the installed app) in the night of the Modèle B.
 * The inline script covers the first paint; on a client navigation (the installed app opens on
 * /demarrage, then goes to /app) Next writes the theme-color of the root layout again, so it is
 * set back each time the head changes.
 */
export function PhoneThemeColor() {
  useEffect(() => {
    const apply = () => {
      for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'))
        if (meta.content !== PHONE_NIGHT) meta.content = PHONE_NIGHT;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    return () => observer.disconnect();
  }, []);
  return null;
}
