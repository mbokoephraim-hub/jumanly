"use client";

import "@/styles/fil-actualiser.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PhoneIcon } from "./icon";
import { REFRESHED_EVENT } from "./fresh";

/** How far the finger pulls the disc at most, and from where letting go refreshes (px). */
const PULL_MAX = 110;
const READY = 70;

/** Inside a sheet, a field, or a list that scrolls on its own: the finger is left to them. */
function scrolledInside(target: Element, layer: HTMLElement) {
  if (target.closest("dialog, [role='dialog'], input, textarea, select, [contenteditable]"))
    return true;
  for (let node: Element | null = target; node && node !== layer; node = node.parentElement) {
    if (node.scrollTop > 0) return true;
  }
  return false;
}

/**
 * Pulling down to refresh, on every screen of the phone (Ephraïm, 29/10/2026: « ça ne doit pas
 * être limité au Fil, toutes les pages doivent se rafraîchir »): at the top of the tab or the page
 * shown, pulling it down shows the disc of the Fil that turns with the finger; letting it go past
 * the mark reads the screen again from the server (and the five tabs with it).
 */
export function PhonePullRefresh({ loading }: { loading: string }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [pending, start] = useTransition();
  const busy = useRef(false);
  const refresh = useRef(() => {});
  useEffect(() => {
    busy.current = pending;
    refresh.current = () => {
      if (busy.current || !navigator.onLine) return;
      busy.current = true;
      start(() => router.refresh());
      window.dispatchEvent(new Event(REFRESHED_EVENT));
    };
  }, [pending, router]);

  useEffect(() => {
    let layer: HTMLElement | null = null;
    let from: { x: number; y: number } | null = null;
    let dragging = false;
    let distance = 0;
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target instanceof Element ? event.target : null;
      layer = target?.closest<HTMLElement>(".nb-couche") ?? null;
      from =
        event.touches.length === 1 &&
        touch &&
        target &&
        layer &&
        layer.scrollTop <= 0 &&
        !busy.current &&
        !scrolledInside(target, layer)
          ? { x: touch.clientX, y: touch.clientY }
          : null;
      dragging = false;
      distance = 0;
    };
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!from || !touch || !layer) return;
      const dy = touch.clientY - from.y;
      const dx = touch.clientX - from.x;
      if (!dragging) {
        if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
        // Up, sideways (tabs, a carousel) or already scrolled: the screen scrolls as usual.
        if (dy <= 0 || Math.abs(dx) > dy || layer.scrollTop > 0) {
          from = null;
          return;
        }
        dragging = true;
      }
      if (event.cancelable) event.preventDefault();
      distance = Math.max(0, Math.min(PULL_MAX, dy * 0.55));
      setPull(distance);
    };
    const onEnd = () => {
      if (dragging && distance >= READY) refresh.current();
      from = null;
      layer = null;
      dragging = false;
      distance = 0;
      setPull(0);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const shown = pending ? READY : pull;
  return (
    <>
      <div
        className="nb-fil-actu-disque nb-actu-partout"
        data-pret={pull >= READY ? "" : undefined}
        data-tourne={pending ? "" : undefined}
        data-tire={pull > 0 ? "" : undefined}
        style={{
          transform: `translate(-50%, ${shown - 56}px)`,
          opacity: Math.min(1, shown / 40),
        }}
        aria-hidden
      >
        <span style={pending ? undefined : { transform: `rotate(${(pull / READY) * 270}deg)` }}>
          <PhoneIcon name="actualiser" size={22} stroke={2.2} />
        </span>
      </div>
      <p className="sr-only" role="status">
        {pending ? loading : ""}
      </p>
    </>
  );
}
