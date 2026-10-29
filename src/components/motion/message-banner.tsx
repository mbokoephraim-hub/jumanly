"use client";
/* eslint-disable @next/next/no-img-element -- the small photo of the person who wrote */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

export type MessageArrival = {
  id: string;
  name: string;
  image: string | null;
  href: string;
};

const EVENT = "jm:message-arrive";
const DURATION_MS = 5000;

/** Says from anywhere in the signed-in space that a message has just arrived. */
export function showMessageBanner(arrival: MessageArrival) {
  window.dispatchEvent(new CustomEvent<MessageArrival>(EVENT, { detail: arrival }));
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

/**
 * The banner of a new message (Ephraïm 29/10/2026: « peut-être que je suis au Fil, mais qu'une
 * notification me dise vous avez un nouveau message de la part de Sublime Koyi », with their
 * photo). It comes down from the top for 5 seconds, a touch opens the conversation. Like the
 * e-mails, it says who wrote, never what.
 */
export function MessageBanner({
  labels,
}: {
  labels: { title: string; line: string; region: string; close: string };
}) {
  const [shown, setShown] = useState<MessageArrival | null>(null);

  useEffect(() => {
    const onArrival = (event: Event) => setShown((event as CustomEvent<MessageArrival>).detail);
    window.addEventListener(EVENT, onArrival);
    return () => window.removeEventListener(EVENT, onArrival);
  }, []);

  useEffect(() => {
    if (!shown) return;
    const timer = window.setTimeout(() => setShown(null), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [shown]);

  return (
    <div
      role="region"
      aria-label={labels.region}
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[calc(10px+env(safe-area-inset-top))] z-[70] mx-auto flex max-w-[440px] justify-center lg:inset-x-auto lg:right-6"
    >
      {shown && (
        <div
          key={shown.id}
          role="status"
          className="jm-message-banner pointer-events-auto flex w-full items-center gap-3 rounded-[18px] bg-sapin py-2.5 pr-2 pl-2.5 text-blanc shadow-float"
        >
          <Link
            href={shown.href}
            onClick={() => setShown(null)}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <span
              aria-hidden
              className={cx(
                "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[15px] font-semibold",
                !shown.image && "bg-lime text-sapin",
              )}
            >
              {shown.image ? (
                <img
                  src={shown.image}
                  alt=""
                  width={44}
                  height={44}
                  className="size-full object-cover"
                />
              ) : (
                initialsOf(shown.name)
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <b className="truncate text-[14px] leading-5">
                {labels.title.replace("{name}", shown.name)}
              </b>
              <span className="truncate text-[12.5px] leading-[18px] opacity-80">
                {labels.line}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setShown(null)}
            aria-label={labels.close}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[18px] opacity-70"
          >
            <Icon name="fermer" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
