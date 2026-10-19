"use client";

import { useEffect } from "react";

/**
 * The frame of the pages of this lot from 768 px (planche studio-cv). Every page laid out in
 * columns takes the whole content zone (`t-sc-wide`); the studio also takes the whole window
 * (§ 3: no top bar, the 84 px rail even on a computer, `t-studio`). Classes on <html> while the
 * page is shown: React removes them when the router hides the page, so a page kept in the
 * background never changes the frame of another one.
 */
export function StudioFrame({ studio = false }: { studio?: boolean }) {
  useEffect(() => {
    const classes = studio ? ["t-sc-wide", "t-studio"] : ["t-sc-wide"];
    const root = document.documentElement;
    root.classList.add(...classes);
    return () => root.classList.remove(...classes);
  }, [studio]);
  return null;
}
