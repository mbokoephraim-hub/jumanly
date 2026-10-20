"use client";

import { useEffect } from "react";

/** Counts one view of an offer per visit of the browser tab (`/api/offres/[slug]/vue`). */
export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `jm-vue-${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Without storage, every visit counts.
    }
    const url = `/api/offres/${encodeURIComponent(slug)}/vue`;
    if (!navigator.sendBeacon?.(url))
      void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [slug]);
  return null;
}
