"use client";

import { useEffect } from "react";
import { FADE_MS, OPENING_ID, OPENING_MS } from "./opening-script";

/** Once the space is interactive, the logo leaves when its 1.2 s are over (fade of 420 ms). */
export function Opening() {
  useEffect(() => {
    const element = document.getElementById(OPENING_ID);
    if (!element) return;
    const shownFor = Date.now() - Number(element.dataset.debut ?? Date.now());
    const leave = window.setTimeout(
      () => {
        element.classList.add("nb-part");
        window.setTimeout(() => element.remove(), FADE_MS);
      },
      Math.max(0, OPENING_MS - shownFor),
    );
    return () => window.clearTimeout(leave);
  }, []);
  return null;
}
