"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { rootTab, type TabSetName } from "@/lib/phone-tabs";

/** Away from the app longer than this: the tabs are read again when it comes back. */
const AWAY_MS = 60_000;
/** While the app stays open on the first screen of a tab, the tabs are read again this often. */
const EVERY_MS = 10 * 60_000;
/** Event sent once the tabs are read again: the pages loaded ahead are loaded again. */
export const REFRESHED_EVENT = "jm:onglets-relus";

/** Someone is typing, or a sheet is open: nothing moves under their fingers. */
function busy() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.closest("input, textarea, select, [contenteditable]"))
    return true;
  return document.querySelector("dialog[open]") !== null;
}

/**
 * Keeps the five tabs up to date in the background, and the app on the phone's storage
 * (Ephraïm, 29/10/2026: « quand on rafraîchit, toutes les pages en arrière-plan sont mises à jour,
 * comme WhatsApp »):
 * - the tabs are drawn by the layout, so one reading of the screen refreshes all of them at once:
 *   when the app comes back after a minute away, when the network comes back, every ten minutes
 *   on the first screen of a tab, and when a page shown from the phone's copy got its fresh version;
 * - the browser is asked to keep the app's storage (pages, pictures) and never to clear it to free
 *   space, as for an installed app.
 */
export function PhoneFreshness({ set = "talent" }: { set?: TabSetName }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();
  const path = useRef(pathname);
  useEffect(() => {
    path.current = pathname;
  }, [pathname]);

  useEffect(() => {
    void navigator.storage
      ?.persisted?.()
      .then((kept) => kept || navigator.storage.persist())
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let last = Date.now();
    let hiddenAt = 0;
    const refresh = () => {
      if (!navigator.onLine || busy()) return;
      last = Date.now();
      start(() => router.refresh());
      window.dispatchEvent(new Event(REFRESHED_EVENT));
    };
    const onTab = () => rootTab(path.current, set) !== null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS && onTab()) refresh();
    };
    const onOnline = () => onTab() && refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible" || !onTab() || Date.now() - last < EVERY_MS)
        return;
      // Reading down a list: it is not moved; the next minute is tried again.
      const layer = document.querySelector('[data-onglet-couche][data-etat="actif"]');
      if (layer && layer.scrollTop > 200) return;
      refresh();
    }, 60_000);
    // The service worker showed this page from the phone's copy (slow network): fresh data came.
    const onWorker = (event: MessageEvent<{ type?: string; path?: string }>) => {
      if (event.data?.type === "page-updated" && event.data.path === window.location.pathname)
        refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    navigator.serviceWorker?.addEventListener("message", onWorker);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker?.removeEventListener("message", onWorker);
      window.clearInterval(timer);
    };
  }, [router, set]);

  return null;
}
