"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { PRELOAD_MAX, preloadAllowed, preloadPath } from "@/lib/phone-preload";
import { REFRESHED_EVENT } from "./fresh";

type Connection = { saveData?: boolean; effectiveType?: string };

/** When each page was last asked for in this visit, kept across screens. */
const asked = new Map<string, number>();
/** A preloaded page is kept 30 s by the router (`staleTimes.static`): asked again after. */
const FRESH_MS = 28_000;

/**
 * An action that calls `refresh()` (Next: « dynamic data only ») redraws the screen shown but keeps
 * the pages loaded ahead, which may then show data from before it (« 1 leçon sur 4 » after the
 * second one). Its answer is read as a full revalidation instead, as `revalidatePath` does, so
 * that Next drops those pages too; they load again. Other actions are left as they are.
 */
function dropPreloadedAfterRefresh() {
  const original = window.fetch;
  window.fetch = async (input, init) => {
    const response = await original(input, init);
    if (!new Headers(init?.headers).has("next-action")) return response;
    if (response.headers.get("x-action-revalidated") !== "2") return response;
    const headers = new Headers(response.headers);
    headers.set("x-action-revalidated", "1");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
  return () => {
    window.fetch = original;
  };
}

/** Waits until the phone has nothing else to do (or a short while where that is not known). */
const idle = (run: () => void) => {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 300);
  }
};

/**
 * Loads in the background, whole (data included), the pages the links of the phone lead to: the
 * five tabs are mounted, so this covers what each tab can open. The links of the screen shown come
 * first, two at a time, when the phone is idle; nothing on a slow or counted connection. A page
 * already loaded opens at once on a tap (brief § 3, « préchargement »).
 */
export function PhonePreload() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    if (!preloadAllowed(connection)) return;
    let stopped = false;
    let timer = 0;

    const run = (onScreen = false) => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>(".nb-app a[href]")]
        .filter((link) => !link.hasAttribute("download") && link.target !== "_blank")
        .filter((link) => !onScreen || link.offsetParent !== null)
        // What is on the screen first, then the hidden tabs.
        .sort((a, b) => Number(b.offsetParent !== null) - Number(a.offsetParent !== null));
      const now = Date.now();
      const batch: string[] = [];
      for (const link of links) {
        const path = preloadPath(link.getAttribute("href") ?? "", pathname);
        if (!path || batch.includes(path) || (asked.get(path) ?? 0) > now - FRESH_MS) continue;
        batch.push(path);
        asked.set(path, now);
        if (batch.length >= PRELOAD_MAX) break;
      }
      const next = () => {
        if (stopped) return;
        const path = batch.shift();
        if (!path) return;
        router.prefetch(path, { kind: PrefetchKind.FULL });
        idle(next);
      };
      idle(next);
      idle(next);
    };

    // While the opening logo shows (29/10/2026: « pendant le logo, l'appli télécharge déjà toutes
    // les pages »); again when links appear (a list loaded, a sheet opened), at most once a second.
    timer = window.setTimeout(run, 300);
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 1000);
    });
    // While the screen stays open, what it shows is loaded again before it gets old.
    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") run(true);
    }, FRESH_MS + 1000);
    // The tabs were read again (src/components/phone/fresh.tsx): what was loaded ahead was dropped
    // with them, it is loaded again.
    const onRefreshed = () => {
      asked.clear();
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 1500);
    };
    window.addEventListener(REFRESHED_EVENT, onRefreshed);
    const restore = dropPreloadedAfterRefresh();
    const root = document.querySelector(".nb-app");
    if (root) observer.observe(root, { childList: true, subtree: true });
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(refresh);
      restore();
      window.removeEventListener(REFRESHED_EVENT, onRefreshed);
      observer.disconnect();
    };
  }, [pathname, router]);

  return null;
}
