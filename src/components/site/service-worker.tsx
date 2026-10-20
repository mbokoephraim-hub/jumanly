"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/brand/icon";
import { OFFLINE_SLOT_ID, slowNetwork } from "@/lib/connection";

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};
const subscribeNever = () => () => undefined;

const SLOW_SEEN_KEY = "jm-slow-seen";
const WARM_KEY = "jm-garde";
/** Main pages of the talent space, kept on the device once per session so they open offline. */
const WARM_PATHS = [
  "/app",
  "/app/jobs",
  "/app/learn",
  "/app/suivi",
  "/app/compte",
  "/app/profil",
  "/app/messages",
  "/app/orbi",
];

/** Asks the worker to keep the main pages, once per session, from the signed-in space only. */
async function warmOnce() {
  try {
    if (!window.location.pathname.startsWith("/app") || sessionStorage.getItem(WARM_KEY)) return;
    sessionStorage.setItem(WARM_KEY, "1");
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: "warm", paths: WARM_PATHS });
  } catch {
    // Nothing kept: pages still open with the network.
  }
}

function slowOnce() {
  try {
    if (!slowNetwork() || sessionStorage.getItem(SLOW_SEEN_KEY)) return false;
    sessionStorage.setItem(SLOW_SEEN_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/**
 * Registers the service worker (public/sw.js) in production, and says how the connection is
 * (mockup 08-05): a Nuit banner while offline, with « Réessayer »; the « Connexion rétablie. »
 * toast when the network comes back; a one-time notice on a slow connection. Once per session it
 * also has the main pages kept on the device, so the app opens offline like a messaging app.
 * In development the worker is not used, so pages always come from the server.
 */
export function ServiceWorker({ enabled }: { enabled: boolean }) {
  const t = useTranslations("system");
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const slot = useSyncExternalStore(
    subscribeNever,
    () => document.getElementById(OFFLINE_SLOT_ID),
    () => null,
  );
  const [back, setBack] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    // After the page is shown, so it never competes with what the person opened.
    const timer = setTimeout(() => void warmOnce(), 2500);
    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (setter: (value: boolean) => void, ms: number) => {
      setter(true);
      clearTimeout(timer);
      timer = setTimeout(() => setter(false), ms);
    };
    const onOnline = () => show(setBack, 4000);
    window.addEventListener("online", onOnline);
    // Checked once the page is shown; the notice comes back in the next session only.
    const first = setTimeout(() => {
      if (slowOnce()) show(setSlow, 8000);
    }, 0);
    return () => {
      window.removeEventListener("online", onOnline);
      clearTimeout(timer);
      clearTimeout(first);
    };
  }, []);

  const banner = !online ? (
    <div className="flex items-center gap-3 rounded-[16px] bg-nuit py-2 pr-2 pl-[18px] text-blanc">
      <Icon name="notification" aria-hidden className="size-[18px] shrink-0 text-ambre" />
      <p className="flex-1 py-1.5 text-sm leading-5">{t("offline.banner")}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="h-8 shrink-0 rounded-pill bg-blanc/10 px-3.5 text-xs font-semibold text-blanc ring-1 ring-blanc/22 ring-inset hover:bg-blanc/18"
      >
        {t("error.retry")}
      </button>
    </div>
  ) : slow ? (
    <div className="flex items-center gap-3 rounded-[16px] bg-ambre-fond px-4 py-3 text-sapin">
      <Icon name="horloge" aria-hidden className="size-[18px] shrink-0 text-ambre-texte" />
      <p className="flex-1 text-sm leading-5">{t("offline.slow")}</p>
    </div>
  ) : null;

  return (
    <>
      {slot && banner && createPortal(banner, slot)}
      <div role="status" className="fixed inset-x-4 top-4 z-50">
        {!slot && banner && <div className="mx-auto max-w-3xl">{banner}</div>}
      </div>
      <div
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center lg:bottom-6"
      >
        {back && (
          <p className="flex w-full max-w-md items-center gap-3 rounded-[16px] bg-sapin py-3.5 pr-4 pl-[18px] text-sm leading-5 text-blanc shadow-float">
            <span
              aria-hidden
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-lime text-sapin"
            >
              <Icon name="check" className="size-3.5" />
            </span>
            {t("offline.back")}
          </p>
        )}
      </div>
    </>
  );
}
