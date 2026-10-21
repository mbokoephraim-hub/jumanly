"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PHONE_AGENT, PHONE_QUERY, VIEW_COOKIE, type View } from "@/lib/view";

/**
 * Keeps the server told of the width of a browser that is not a phone (src/server/view.ts): a
 * computer window narrowed under 768 px gets the phone interface, widened again the web one.
 */
export function ViewSync({ view }: { view: View }) {
  const router = useRouter();
  useEffect(() => {
    if (PHONE_AGENT.test(navigator.userAgent)) return;
    const media = window.matchMedia(PHONE_QUERY);
    const sync = () => {
      const wanted: View = media.matches ? "phone" : "wide";
      document.cookie = `${VIEW_COOKIE}=${wanted}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      if (wanted !== view) router.refresh();
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [router, view]);
  return null;
}
