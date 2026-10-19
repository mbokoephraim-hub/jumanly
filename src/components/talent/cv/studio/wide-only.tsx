"use client";

import { useSyncExternalStore, type ReactNode } from "react";

/** The width from which the talent space is laid out for a tablet or a computer (brief web § 0). */
const WIDE = "(min-width: 768px)";

function subscribe(callback: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/**
 * Mounts its content on a tablet or a computer only: the A4 previews of the web studio (CV cards,
 * gallery, studio page) are never built on a phone, where their layout is hidden.
 */
export function WideOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  return wide ? children : fallback;
}
