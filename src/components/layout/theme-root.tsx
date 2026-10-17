"use client";

import { useEffect } from "react";

/**
 * Puts the theme of the signed-in space on <html> too (docs/ux-mobile-talent V6 § B7): the shell
 * carries it from the server, and sheets moved to the body follow it through <html>. Leaving the
 * space takes it away.
 */
export function ThemeRoot({ theme }: { theme: "light" | "green" }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("jm-vert", theme === "green");
    return () => root.classList.remove("jm-vert");
  }, [theme]);
  return null;
}
