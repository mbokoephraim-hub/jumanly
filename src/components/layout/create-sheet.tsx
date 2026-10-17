"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { BodyPortal } from "./body-portal";

export type CreateAction = {
  key: string;
  href: string;
  icon: IconName;
  label: string;
  /** Fill of the drawing area (the colours of screen 60). */
  tone: string;
  /** The card itself is tinted (« Passer à Premium »). */
  featured?: boolean;
};

/**
 * The « + » of the top bar (docs/ux-mobile-talent V6 § B5, V7 § B8, screen 60): a sheet « Créer »
 * whose tiles open existing pages, each with its own rules (applying stays free, the AI checks its
 * rights and credits). Without JavaScript the button is a link to the offers.
 */
export function CreateSheet({
  label,
  title,
  closeLabel,
  actions,
}: {
  label: string;
  title: string;
  closeLabel: string;
  actions: CreateAction[];
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const button = useRef<HTMLAnchorElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [path, setPath] = useState(pathname);
  if (path !== pathname) {
    setPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Link
        ref={button}
        href={actions[0]?.href ?? "/app/jobs"}
        role="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          setOpen(true);
        }}
        className="jm-top-plus grid size-10 shrink-0 place-items-center rounded-full"
      >
        <Icon name="plus" className="size-5" />
      </Link>
      {open && (
        <BodyPortal>
          <div className="fixed inset-0 z-[60] md:hidden">
            <button
              type="button"
              aria-label={closeLabel}
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-nuit/45"
            />
            <div
              ref={sheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="jm-sheet absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-creme px-4 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sapin"
            >
              <span aria-hidden className="mx-auto h-[5px] w-10 rounded-[3px] bg-sapin/20" />
              <div className="flex items-center justify-between">
                <h2 id={titleId} className="text-[20px] font-semibold tracking-[-0.02em]">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    button.current?.focus();
                  }}
                  aria-label={closeLabel}
                  className="grid size-10 place-items-center rounded-full bg-blanc shadow-douce"
                >
                  <Icon name="fermer" className="size-5" />
                </button>
              </div>
              <ul className="grid grid-cols-3 gap-2.5">
                {actions.map((action) => (
                  <li key={action.key}>
                    <Link
                      href={action.href}
                      className={cx(
                        "jm-press flex h-full flex-col items-center gap-2.5 rounded-[22px] p-2 pb-3.5 text-center text-[13px] leading-[1.25] font-semibold shadow-douce",
                        action.featured
                          ? "bg-[linear-gradient(160deg,#EEFBDD,#E3F67C)]"
                          : "bg-blanc",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "grid h-[64px] w-full place-items-center rounded-[16px]",
                          action.tone,
                        )}
                      >
                        <span className="grid size-9 place-items-center rounded-[12px] bg-blanc shadow-[0_4px_10px_-6px_rgb(15_63_55/0.4)]">
                          <Icon name={action.icon} className="size-[18px]" />
                        </span>
                      </span>
                      {action.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BodyPortal>
      )}
    </>
  );
}
