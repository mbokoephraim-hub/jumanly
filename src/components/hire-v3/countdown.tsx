"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** The countdown to the next interview (`cdStart()` of the prototype): hh:mm:ss, every second. */
export function HireCountdown({ at }: { at: string }) {
  const target = new Date(at).getTime();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  const s = Math.floor((left ?? 0) / 1000);
  return (
    <div className="cd" aria-hidden="true">
      {left === null
        ? ""
        : `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`}
    </div>
  );
}
