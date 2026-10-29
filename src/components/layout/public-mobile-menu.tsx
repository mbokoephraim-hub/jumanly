"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BodyPortal } from "./body-portal";

/**
 * Menu of the public header on phones and tablets (29/10/2026): the round button turns its three
 * lines into a back arrow, the page behind blurs and the menu floats in below the header. Closes
 * with the arrow, a tap outside, Échap, or any link.
 */
export function PublicMobileMenu({
  openLabel,
  closeLabel,
  menuLabel,
  children,
}: {
  openLabel: string;
  closeLabel: string;
  menuLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [shownFor, setShownFor] = useState(pathname);
  // A new page closes the menu.
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="jm-site-menu"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((value) => !value)}
        className="jm-burger relative grid size-11 shrink-0 place-items-center rounded-full bg-[rgb(255_255_255/0.06)] text-lime ring-1 ring-sapin/15 transition-colors ring-inset hover:bg-[rgb(255_255_255/0.12)] xl:hidden"
        data-open={open || undefined}
      >
        <span aria-hidden className="jm-burger-lines">
          <span />
          <span />
          <span />
        </span>
      </button>
      <BodyPortal>
        <div
          className="jm-site-b jm-site-menu xl:hidden"
          data-open={open || undefined}
          aria-hidden={!open}
          inert={!open}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label={closeLabel}
            className="jm-site-menu-veil"
            onClick={() => setOpen(false)}
          />
          <nav
            id="jm-site-menu"
            aria-label={menuLabel}
            className="jm-site-menu-panel jm-glass-edge"
            onClick={(event) => {
              if ((event.target as Element).closest("a")) setOpen(false);
            }}
          >
            {children}
          </nav>
        </div>
      </BodyPortal>
    </>
  );
}
