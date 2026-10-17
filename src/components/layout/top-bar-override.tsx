"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TOP_BAR_SLOT_ID } from "@/lib/top-bar";

const subscribe = () => () => {};

/**
 * Replaces the top bar of a phone while the page is shown (screens 24 and 51: back arrow and the
 * name of the person). The content is marked active only while the page is mounted and visible,
 * so the default title and tools come back as soon as the page is left or kept hidden.
 */
export function TopBarOverride({ children }: { children: ReactNode }) {
  const slot = useSyncExternalStore(
    subscribe,
    () => document.getElementById(TOP_BAR_SLOT_ID),
    () => null,
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    node?.setAttribute("data-active", "");
    return () => node?.removeAttribute("data-active");
  }, [slot]);
  if (!slot) return null;
  return createPortal(
    <div
      ref={ref}
      data-top-override
      className="-ml-2 hidden min-w-0 flex-1 items-center gap-1 data-active:flex"
    >
      {children}
    </div>,
    slot,
  );
}
