"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/brand/icon";

/** How long the message of the day stays before folding away. */
const STAY_MS = 8000;

/**
 * Message of the day under the dashboard greeting (docs/experience-animee § 4.1): one useful
 * sentence drawn from the real state of the account, shown at the first visit of the day only,
 * folding away after 8 s or on a click. Without JavaScript it stays hidden: the same information
 * is in « Votre prochaine étape ».
 */
export function DailyWelcome({
  person,
  sentence,
  href,
  closeLabel,
}: {
  /** Distinguishes the accounts that share a device. */
  person: string;
  sentence: string;
  href: string;
  closeLabel: string;
}) {
  const [state, setState] = useState<"hidden" | "shown" | "leaving">("hidden");

  useEffect(() => {
    const key = `jm-welcome:${person}`;
    const today = new Date().toLocaleDateString("fr-CA");
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(key);
    } catch {}
    if (seen === today) {
      // Back on a page kept in memory: a message still open folds away.
      const frame = requestAnimationFrame(() =>
        setState((now) => (now === "shown" ? "leaving" : now)),
      );
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => {
      try {
        localStorage.setItem(key, today);
      } catch {}
      setState("shown");
    });
    const timer = window.setTimeout(() => setState("leaving"), STAY_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [person]);

  useEffect(() => {
    if (state !== "leaving") return;
    const timer = window.setTimeout(() => setState("hidden"), 400);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Admin v4: the slot takes room only while the message shows (once a day), so the page does not
  // keep an empty line under the title the rest of the day.
  if (state === "hidden") return null;
  return (
    <span className="mt-1.5 flex h-9 items-center">
      <span
        data-leaving={state === "leaving" ? "" : undefined}
        className="jm-welcome flex max-w-full items-center gap-2.5 rounded-pill bg-blanc py-0.5 pr-0.5 pl-2 ring-1 ring-sapin/10"
      >
        <span aria-hidden className="jm-orb size-4 shrink-0 rounded-full" />
        <Link
          href={href}
          className="min-w-0 text-[13px] font-medium underline-offset-2 hover:underline lg:text-sm"
        >
          {sentence}
        </Link>
        <button
          type="button"
          onClick={() => setState("leaving")}
          aria-label={closeLabel}
          className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-creme"
        >
          <Icon name="fermer" className="size-3.5" />
        </button>
      </span>
    </span>
  );
}
