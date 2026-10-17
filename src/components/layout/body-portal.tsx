"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noSubscription = () => () => {};

/**
 * Moves a sheet to the end of the body once the page runs: the page's entrance animation and the
 * bottom menu would otherwise sit above it. Before that (and without JavaScript) it stays in place.
 */
export function BodyPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  return mounted ? createPortal(children, document.body) : children;
}
