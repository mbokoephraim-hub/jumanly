"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { markAllNotificationsReadInPlace } from "@/server/actions/connect";
import { showToast } from "@/components/motion/toaster";

type Item = {
  id: string;
  text: string;
  href: string | null;
  when: string;
  createdAt: string;
  unread: boolean;
  important: boolean;
};

export type BellLabels = {
  /** `notifications.bell.aria` for 0, for 1, and for many with `#` in place of the number. */
  aria: { zero: string; one: string; other: string };
  many: string;
  title: string;
  seeAll: string;
  markAllRead: string;
  close: string;
  empty: string;
};

/** The bell asks again every minute, only while the tab is visible (brief § 4.3). */
const POLL_MS = 60_000;

/**
 * Bell of the top bar (docs/experience-animee § 4.3). Without JavaScript it is a link to
 * /app/notifications; with it, it opens a panel of the latest notifications, rings when a new one
 * arrives, and an important one also shows a toast.
 */
export function NotificationBell({
  initialUnread,
  tone,
  labels,
}: {
  initialUnread: number;
  tone: "light" | "dark";
  labels: BellLabels;
}) {
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(0);
  const [pending, startTransition] = useTransition();
  const seen = useRef<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;
    const data = (await response.json()) as { unread: number; items: Item[] };
    const newest = data.items[0]?.createdAt ?? null;
    // Anything newer than what this bell already knew has just arrived.
    if (seen.current !== null) {
      const arrived = data.items.filter((item) => item.unread && item.createdAt > seen.current!);
      if (arrived.length > 0) setRing((value) => value + 1);
      for (const item of arrived.filter((entry) => entry.important).slice(0, 2)) {
        showToast({ message: item.text, href: item.href ?? undefined, tone: "info" });
      }
    }
    if (newest && (seen.current === null || newest > seen.current)) seen.current = newest;
    if (seen.current === null) seen.current = "";
    setUnread(data.unread);
    setItems(data.items);
  }, []);

  // A new page from the server brings a fresh count; so does a new path close the panel.
  const [known, setKnown] = useState({ initialUnread, pathname });
  if (known.initialUnread !== initialUnread || known.pathname !== pathname) {
    if (known.initialUnread !== initialUnread) setUnread(initialUnread);
    if (known.pathname !== pathname) setOpen(false);
    setKnown({ initialUnread, pathname });
  }

  // Polling, by the visible bell only (the shell has one for phones and one for computers).
  useEffect(() => {
    const visible = () =>
      document.visibilityState === "visible" && root.current?.offsetParent !== null;
    let timer = 0;
    const tick = () => {
      if (visible()) void load();
    };
    const first = window.setTimeout(tick, 1500);
    timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLElement>("[data-bell]")?.focus();
      }
    };
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const aria =
    unread === 0
      ? labels.aria.zero
      : unread === 1
        ? labels.aria.one
        : labels.aria.other.replace("#", String(unread));

  const markAll = () =>
    startTransition(async () => {
      await markAllNotificationsReadInPlace();
      setItems((list) => list?.map((item) => ({ ...item, unread: false })) ?? null);
      setUnread(0);
    });

  return (
    <div ref={root} className="relative shrink-0">
      <Link
        href="/app/notifications"
        data-bell
        aria-label={aria}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          setOpen((value) => !value);
          if (!open) void load();
        }}
        className={cx(
          "relative flex size-10 items-center justify-center rounded-full",
          tone === "light" ? "bg-blanc hover:bg-brume" : "hover:bg-blanc/10",
        )}
      >
        <span key={ring} className={cx("flex", ring > 0 && "jm-bell-ring")}>
          <Icon name="notification" className="size-5" />
        </span>
        {unread > 0 && (
          <span
            key={`badge-${ring}`}
            aria-hidden
            className={cx(
              "jm-badge-pulse absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center overflow-hidden rounded-full bg-lime px-1 text-[10px] font-semibold text-sapin ring-2 ring-blanc",
              ring > 0 && "jm-badge-in",
            )}
          >
            <span className={cx("block", ring > 0 && "jm-count-roll")}>
              {unread > 9 ? labels.many : unread}
            </span>
          </span>
        )}
      </Link>
      <div
        id={panelId}
        role="region"
        aria-label={labels.title}
        hidden={!open}
        className="jm-panel fixed inset-x-4 top-16 z-50 origin-top-right rounded-[22px] bg-blanc p-2 text-sapin shadow-float ring-1 ring-sapin/8 sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-[360px]"
      >
        <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1">
          <p className="text-[15px] font-semibold">{labels.title}</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.close}
            className="flex size-9 items-center justify-center rounded-full hover:bg-creme"
          >
            <Icon name="fermer" className="size-4" />
          </button>
        </div>
        {items && items.length === 0 && (
          <p className="px-3 py-4 text-sm text-ardoise">{labels.empty}</p>
        )}
        {items && items.length > 0 && (
          <ul className="flex flex-col gap-1" aria-live="polite">
            {items.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={item.href ?? "/app/notifications"}
                  data-unread={item.unread ? "" : undefined}
                  style={{ "--i": index } as React.CSSProperties}
                  className={cx(
                    "jm-notif flex flex-col gap-0.5 rounded-[14px] px-3 py-2.5 text-sm hover:bg-creme",
                    item.unread && "font-semibold",
                  )}
                >
                  <span>{item.text}</span>
                  <span className="text-xs font-normal text-ardoise">{item.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-brume px-3 pt-2 pb-1">
          <Link href="/app/notifications" className="text-sm font-semibold underline">
            {labels.seeAll}
          </Link>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              disabled={pending}
              className="h-9 rounded-pill px-3 text-sm font-medium hover:bg-creme disabled:opacity-60"
            >
              {labels.markAllRead}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
