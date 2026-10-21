"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { TalentIcon } from "./icon";

/**
 * Whether the place of a sheet is shown. A wrapper of the web layout that steps aside on a phone
 * (`display: contents`, `t-rw-*`) has no box of its own: its own parent decides.
 */
function shown(node: HTMLElement) {
  let parent = node.parentElement;
  while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement;
  return parent?.checkVisibility?.() !== false;
}

/**
 * Bottom sheet of the talent space (planche talent-1 : .sheet), in a <dialog>: it rises over the
 * page without changing it, a tap on the veil or « Fermer » closes it. `openParam` opens it when
 * the address carries that parameter (a link from a card, the answer of a form), and removes the
 * parameter on closing so « Retour » does not open it again.
 */
export function Sheet({
  id,
  title,
  titleHidden = false,
  closeLabel,
  openParam,
  defaultOpen = false,
  head,
  className,
  children,
}: {
  id: string;
  title: string;
  titleHidden?: boolean;
  closeLabel: string;
  openParam?: string;
  defaultOpen?: boolean;
  /** Replaces the title row (Orbi's head). The title stays for screen readers. */
  head?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    // A sheet of the phone layout hidden on a computer (`.t-mob`) never opens there: a hidden modal
    // would leave the whole page inert.
    if (defaultOpen && node && !node.open && shown(node)) node.showModal();
  }, [defaultOpen]);

  const onClose = () => {
    if (!openParam) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(openParam)) return;
    url.searchParams.delete(openParam);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <dialog
      ref={dialog}
      id={id}
      className={cx("t-sheet t-auto", className)}
      aria-labelledby={`${id}-t`}
      onClose={onClose}
      onClick={(event) => {
        // A link of the sheet leads elsewhere: the sheet closes, or the screen kept behind the next
        // one would leave it modal and the new screen inert.
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (event.target === event.currentTarget || link) event.currentTarget.close();
      }}
    >
      <div className="t-poignee" aria-hidden />
      <div className="flex items-start justify-between gap-3">
        {head ? (
          <>
            <h2 id={`${id}-t`} className="sr-only">
              {title}
            </h2>
            <div className="min-w-0 flex-1">{head}</div>
          </>
        ) : (
          <h2 id={`${id}-t`} className={cx(titleHidden && "sr-only")}>
            {title}
          </h2>
        )}
        <button
          type="button"
          className="t-bi t-press"
          aria-label={closeLabel}
          onClick={() => dialog.current?.close()}
        >
          <TalentIcon name="fermer" size="s" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

/** Wide screens, where a menu opens under its button instead of rising from the bottom. */
const WIDE = "(min-width: 768px)";

/**
 * Places an open menu under (or above) the button that opened it, kept inside the window: the
 * `--t-ancre-x` and `--t-ancre-y` of `.t-rx-ancre` (planche web recruteur-1 `.mn-o`).
 */
function anchorTo(sheet: HTMLElement, button: HTMLElement) {
  if (!window.matchMedia(WIDE).matches) return;
  const box = button.getBoundingClientRect();
  const width = sheet.offsetWidth;
  const height = sheet.offsetHeight;
  const x = Math.min(Math.max(16, box.right - width), window.innerWidth - width - 16);
  const below = box.bottom + 6;
  const y = below + height <= window.innerHeight - 16 ? below : Math.max(16, box.top - height - 6);
  sheet.style.setProperty("--t-ancre-x", `${Math.round(x)}px`);
  sheet.style.setProperty("--t-ancre-y", `${Math.round(y)}px`);
}

/** Opens the sheet `target`; inside another sheet, that one closes first. */
export function SheetButton({
  target,
  className,
  label,
  anchor = false,
  children,
}: {
  target: string;
  className?: string;
  label?: string;
  /** On a computer or a tablet, the sheet opens as a menu under this button. */
  anchor?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-controls={target}
      aria-label={label}
      className={className}
      onClick={(event) => {
        event.currentTarget.closest("dialog")?.close();
        const sheet = document.getElementById(target);
        if (sheet instanceof HTMLDialogElement && !sheet.open) {
          sheet.showModal();
          if (anchor) anchorTo(sheet, event.currentTarget);
        }
      }}
    >
      {children}
    </button>
  );
}

/** Closes the sheet that holds it (« Compris » of a window on a computer). */
export function CloseSheetButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => event.currentTarget.closest("dialog")?.close()}
    >
      {children}
    </button>
  );
}
