"use client";

import "@/styles/phone-push.css";
import { useEffect, useState } from "react";
import { pushKeyAction, savePushDeviceAction } from "@/server/actions/push";

export type PushLabels = {
  title: string;
  text: string;
  yes: string;
  later: string;
  done: string;
  blocked: string;
  ios: string;
  failed: string;
};

const LATER_KEY = "jm-push-plus-tard";

type State = "hidden" | "ask" | "ios" | "blocked" | "done" | "failed";

const supported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** iPhone and iPad: notifications only once Jumanly is on the home screen. */
const iosOutsideHomeScreen = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !(
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone
  );

const keyBytes = (base64: string) => {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

/** Subscribes this device and tells the platform; the browser asks first when it has to. */
async function subscribeDevice() {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(await pushKeyAction()),
    }));
  const json = subscription.toJSON();
  const saved = await savePushDeviceAction({
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  });
  return saved.ok;
}

/**
 * « Recevoir vos messages sur ce téléphone » (Ephraïm 29/10/2026: « même quand on n'était pas dans
 * l'application, qu'on voie le message reçu »). The browser asks only when the person touches
 * « Activer ». `place`: the Chat lets it be put off (« Plus tard »); the notifications keep it until
 * it is on. Once allowed, it stays silent and keeps this device subscribed (`silent`).
 */
export function PushPrompt({
  labels,
  place = "notifications",
}: {
  labels?: PushLabels;
  place?: "notifications" | "chat" | "silent";
}) {
  const [state, setState] = useState<State>("hidden");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let later = false;
    try {
      later = place === "chat" && Boolean(window.localStorage.getItem(LATER_KEY));
    } catch {
      // Storage blocked: the card shows.
    }
    // Read once the page is on the device: the browser's state is not known on the server.
    const timer = window.setTimeout(() => {
      if (!supported()) {
        if (place === "notifications" && iosOutsideHomeScreen()) setState("ios");
        return;
      }
      if (Notification.permission === "granted") {
        // Allowed already: keep this device subscribed, nothing to show.
        void subscribeDevice().catch(() => undefined);
        return;
      }
      if (place === "silent") return;
      if (Notification.permission === "denied") {
        if (place === "notifications") setState("blocked");
        return;
      }
      if (!later) setState("ask");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [place]);

  if (!labels || state === "hidden") return null;

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") setState(permission === "denied" ? "blocked" : "ask");
      else setState((await subscribeDevice()) ? "done" : "failed");
    } catch {
      setState("failed");
    } finally {
      setBusy(false);
    }
  };
  const putOff = () => {
    try {
      window.localStorage.setItem(LATER_KEY, "1");
    } catch {
      // Not kept: it shows again next time.
    }
    setState("hidden");
  };

  if (state !== "ask")
    return (
      <div className="nb-push" role="status">
        <p>
          {state === "done"
            ? labels.done
            : state === "blocked"
              ? labels.blocked
              : state === "ios"
                ? labels.ios
                : labels.failed}
        </p>
      </div>
    );
  return (
    <section className="nb-push" aria-labelledby="nb-push-t">
      <b id="nb-push-t">{labels.title}</b>
      <p>{labels.text}</p>
      <div className="nb-push-actions">
        <button type="button" className="nb-bouton" data-plein="" disabled={busy} onClick={enable}>
          {labels.yes}
        </button>
        {place === "chat" ? (
          <button type="button" className="nb-bouton" data-contour="" onClick={putOff}>
            {labels.later}
          </button>
        ) : null}
      </div>
    </section>
  );
}
