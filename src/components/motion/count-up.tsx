"use client";

import { useEffect, useRef } from "react";
import { motionReduced } from "@/lib/motion";

/**
 * A real number that counts up from 0 once (docs/experience-animee § 8). The final value is in the
 * page from the start (server render, screen readers, no JavaScript); only the digits move.
 */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || motionReduced()) return;
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / duration);
      node.textContent = String(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      node.textContent = String(value);
    };
  }, [value, duration]);
  return (
    <>
      <span aria-hidden ref={ref}>
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}
