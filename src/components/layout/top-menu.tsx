"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/**
 * Menu of the top bar of a phone (docs/ux-mobile-talent, screen 34, V6 § B3): a small card
 * anchored under the Menu button, not a page. Without JavaScript the button is a link to Mon
 * espace; with it, it opens the card. It closes on Escape, on a touch outside and on a new page;
 * the focus stays inside while it is open and comes back to the button when it closes.
 */
export function TopMenu({
  label,
  openLabel,
  trigger,
  align = "right",
  triggerClassName = "grid size-11 place-items-center rounded-full",
  children,
}: {
  /** Side the card hangs from: the Menu button is on the left of the bar (V6 § B3). */
  align?: "left" | "right";
  triggerClassName?: string;
  /** Names the card for screen readers. */
  label: string;
  /** Names the button. */
  openLabel: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLAnchorElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(pathname);
  if (path !== pathname) {
    setPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const close = (focus: boolean) => {
      setOpen(false);
      if (focus) button.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <>
      {/* Dims the page behind the card; a touch on it lands outside the menu, which closes it. */}
      {open && <div aria-hidden className="fixed inset-0 z-40 bg-nuit/35" />}
      <div ref={root} className="relative z-50 shrink-0">
        <Link
          ref={button}
          href="/app/espace"
          role="button"
          aria-label={openLabel}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            setOpen((value) => !value);
          }}
          className={triggerClassName}
        >
          {trigger}
        </Link>
        <div
          ref={panel}
          id={panelId}
          role="dialog"
          aria-label={label}
          hidden={!open}
          className={cx(
            "jm-panel absolute top-[calc(100%+8px)] z-50 flex w-[min(300px,calc(100vw-24px))] flex-col rounded-[24px] bg-blanc p-2 text-sapin shadow-menu",
            "before:absolute before:-top-1.5 before:size-3.5 before:rotate-45 before:rounded-[3px] before:bg-blanc",
            align === "left"
              ? "left-0 origin-top-left before:left-4"
              : "right-0 origin-top-right before:right-4",
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
