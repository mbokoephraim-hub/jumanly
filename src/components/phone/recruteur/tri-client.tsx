"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** How far a finger has to travel for a gesture to count (px). */
const THRESHOLD = 90;

/**
 * A card of the pipeline that can be swiped (« Logique du recrutement », 15 candidats sur un
 * téléphone): to the right « Retenir », to the left « En attente ». The swipe submits the form of
 * the gesture; the buttons of the summary do the same without a gesture. Vertical scrolling stays
 * free (`touch-action: pan-y`).
 */
export function SwipeCard({
  children,
  right,
  left,
  rightLabel,
  leftLabel,
}: {
  children: ReactNode;
  /** The id of the form that « Retenir » submits, null when the member cannot sort. */
  right: string | null;
  left: string | null;
  rightLabel: string;
  leftLabel: string;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dx, setDx] = useState(0);
  const locked = useRef<"x" | "y" | null>(null);
  const moved = useRef(false);
  const enabled = Boolean(right || left);
  const submit = (id: string | null) => {
    if (!id) return;
    const form = document.getElementById(id);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  };
  return (
    <div
      className="nb-rh-glisse"
      data-sens={dx > 24 ? "droite" : dx < -24 ? "gauche" : undefined}
      onPointerDown={(event) => {
        if (!enabled || event.pointerType === "mouse") return;
        start.current = { x: event.clientX, y: event.clientY };
        locked.current = null;
        moved.current = false;
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const x = event.clientX - start.current.x;
        const y = event.clientY - start.current.y;
        if (!locked.current && (Math.abs(x) > 10 || Math.abs(y) > 10))
          locked.current = Math.abs(x) > Math.abs(y) ? "x" : "y";
        if (locked.current === "x") {
          moved.current = true;
          setDx(Math.max(-140, Math.min(140, x)));
        }
      }}
      onPointerUp={() => {
        if (dx >= THRESHOLD) submit(right);
        else if (dx <= -THRESHOLD) submit(left);
        start.current = null;
        setDx(0);
      }}
      onClickCapture={(event) => {
        // A swipe is not a touch: the link under the finger does not open.
        if (moved.current) {
          event.preventDefault();
          event.stopPropagation();
          moved.current = false;
        }
      }}
      onPointerCancel={() => {
        start.current = null;
        setDx(0);
      }}
    >
      <span className="nb-rh-glisse-fond" aria-hidden>
        <span>{rightLabel}</span>
        <span>{leftLabel}</span>
      </span>
      <div
        className="nb-rh-glisse-carte"
        style={dx ? { transform: `translateX(${dx}px)` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The summary in full screen: a horizontal swipe goes to the next candidate (to the left) or the
 * previous one (to the right), in the order of the ranking. The arrows of the page do the same.
 */
export function SwipePager({
  children,
  next,
  previous,
}: {
  children: ReactNode;
  next: string | null;
  previous: string | null;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (next) router.prefetch(next);
    if (previous) router.prefetch(previous);
  }, [next, previous, router]);
  return (
    <div
      className="nb-rh-fr-pager"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches[0];
        if (!start.current || !touch) return;
        const x = touch.clientX - start.current.x;
        const y = touch.clientY - start.current.y;
        start.current = null;
        if (Math.abs(x) < THRESHOLD || Math.abs(x) < Math.abs(y) * 1.5) return;
        const target = x < 0 ? next : previous;
        if (target) router.push(target, { scroll: true });
      }}
    >
      {children}
    </div>
  );
}

/** « Annuler » for 5 seconds after a gesture, then the bar goes away. */
export function UndoBar({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!shown) return null;
  return (
    <div className="nb-rh-tri-annuler" role="status">
      {children}
    </div>
  );
}
