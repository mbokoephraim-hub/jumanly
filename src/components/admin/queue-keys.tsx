"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keyboard shortcuts of a moderation queue (Admin v2, étape 7): J opens the next item, K the
 * previous one. Ignored while typing in a field.
 */
export function QueueKeys({ prev, next }: { prev?: string; next?: string }) {
  const router = useRouter();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      const href = key === "j" ? next : key === "k" ? prev : undefined;
      if (!href) return;
      event.preventDefault();
      router.push(href, { scroll: false });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prev, next]);
  return null;
}
