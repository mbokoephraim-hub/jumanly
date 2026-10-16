"use client";

import { useEffect } from "react";

/** « / » anywhere outside a field puts the cursor in the search (`target` is its id). */
export function SlashFocus({ target }: { target: string }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest("input, textarea, select, [contenteditable='true']")) return;
      const input = document.getElementById(target);
      if (!(input instanceof HTMLInputElement) || input.offsetParent === null) return;
      event.preventDefault();
      input.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target]);
  return null;
}
