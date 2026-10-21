"use client";

import { useEffect, useSyncExternalStore } from "react";
import { TalentIcon } from "@/components/talent/icon";

/**
 * Notifications de l'ordinateur (web recruiter lot 4, planche « Notifications de l'ordinateur »):
 * the browser's own notifications for the bell's news (end of an offer, analysis ready, closed
 * offer). The browser asks for permission only from the settings, when the member turns it on,
 * never on the first visit (brief web § 5). The choice is this browser's: it lives here only.
 */
const PREF = "jumanly.hire.desktop-notifications";
const SEEN = "jumanly.hire.desktop-notifications.seen";
const EVERY_MS = 60_000;

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private window or blocked storage: the setting simply does not stick.
  }
};
const supported = () => typeof window !== "undefined" && "Notification" in window;

type State = "unsupported" | "off" | "on" | "blocked";

function currentState(): State {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return read(PREF) === "on" && Notification.permission === "granted" ? "on" : "off";
}

const CHANGED = "jumanly:desktop-notifications";
const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
};
const changed = () => window.dispatchEvent(new Event(CHANGED));

/** The switch of the settings page; asking the browser happens on this click only. */
export function DesktopNotificationsSetting({
  labels,
}: {
  labels: { title: string; text: string; blocked: string; unsupported: string };
}) {
  const state = useSyncExternalStore<State>(subscribe, currentState, () => "off");

  const toggle = async (on: boolean) => {
    if (!supported()) return;
    if (!on) write(PREF, null);
    else {
      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      if (permission === "granted") {
        write(PREF, "on");
        write(SEEN, new Date().toISOString());
      }
    }
    changed();
  };

  const note =
    state === "blocked" ? labels.blocked : state === "unsupported" ? labels.unsupported : null;
  return (
    <label className="t-li t-press">
      <span className="t-cases t-c2" aria-hidden>
        <TalentIcon name="notification" size="s" />
      </span>
      <span className="t-t">
        <b>{labels.title}</b>
        <span>{note ?? labels.text}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={state === "on"}
        disabled={state === "unsupported" || state === "blocked"}
        className="sr-only"
        onChange={(event) => void toggle(event.target.checked)}
      />
      <span aria-hidden className="t-sw" />
    </label>
  );
}

type Item = { id: string; text: string; href: string | null; createdAt: string; unread: boolean };

/**
 * Mounted in the recruiter's frame: when the member turned it on, the bell's new unread items
 * become notifications of the computer. It reads the same route as the bell, every minute.
 */
export function DesktopNotifier({ title }: { title: string }) {
  useEffect(() => {
    if (!supported() || !window.matchMedia("(min-width: 768px)").matches) return;
    let stopped = false;
    const check = async () => {
      if (stopped || read(PREF) !== "on" || Notification.permission !== "granted") return;
      const since = read(SEEN) ?? new Date().toISOString();
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { items: Item[] };
        const fresh = data.items.filter((item) => item.unread && item.createdAt > since);
        for (const item of fresh.slice(0, 3)) {
          const note = new Notification(title, { body: item.text, tag: item.id });
          note.onclick = () => {
            window.focus();
            if (item.href) window.location.assign(item.href);
            note.close();
          };
        }
        const latest = data.items.reduce(
          (max, item) => (item.createdAt > max ? item.createdAt : max),
          since,
        );
        write(SEEN, latest);
      } catch {
        // Offline for a moment: the next round tries again.
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), EVERY_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [title]);
  return null;
}
