"use client";

import { useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

/**
 * Registers the service worker (public/sw.js) in production, and says when the device is offline.
 * In development the worker is not used, so pages always come from the server.
 */
export function ServiceWorker({ enabled }: { enabled: boolean }) {
  const t = useTranslations("system.offline");
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, [enabled]);
  if (online) return null;
  return (
    <p
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 bg-sapin px-4 py-3 text-center text-sm text-blanc"
    >
      {t("banner")}
    </p>
  );
}
