"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { DARK_QUERY, redrawn, type Appearance } from "@/lib/appearance";

/**
 * Light or dark mode of the talent space (brief § 2.10): « Auto » follows the phone, live. The
 * class sits on <html> so sheets moved to the body follow it; leaving the space takes it away
 * (Hire, partner and admin keep their light design). Pages not yet redrawn stay light and wide (REDRAWN).
 */
export function AppearanceRoot({ appearance }: { appearance: Appearance }) {
  const ready = redrawn(usePathname());
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia(DARK_QUERY);
    const apply = () =>
      root.classList.toggle(
        "sombre",
        ready && (appearance === "dark" || (appearance === "auto" && media.matches)),
      );
    apply();
    root.classList.toggle("t-ancien", !ready);
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      root.classList.remove("sombre", "t-ancien");
    };
  }, [appearance, ready]);
  return null;
}
