"use client";

import { useEffect } from "react";
import { DARK_QUERY, type Appearance } from "@/lib/appearance";

/**
 * Light or dark mode of the talent space (brief § 2.10): « Auto » follows the phone, live. The
 * class sits on <html> so sheets moved to the body follow it; leaving the space takes it away
 * (Hire, partner and admin keep their light design until their step).
 */
export function AppearanceRoot({ appearance }: { appearance: Appearance }) {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia(DARK_QUERY);
    const apply = () =>
      root.classList.toggle(
        "sombre",
        appearance === "dark" || (appearance === "auto" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      root.classList.remove("sombre");
    };
  }, [appearance]);
  return null;
}
