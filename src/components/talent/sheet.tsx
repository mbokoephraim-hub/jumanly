"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { TalentIcon } from "./icon";

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
    if (defaultOpen && node && !node.open && node.parentElement?.checkVisibility?.() !== false)
      node.showModal();
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
        if (event.target === event.currentTarget) event.currentTarget.close();
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

/** Opens the sheet `target`; inside another sheet, that one closes first. */
export function SheetButton({
  target,
  className,
  label,
  children,
}: {
  target: string;
  className?: string;
  label?: string;
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
        if (sheet instanceof HTMLDialogElement && !sheet.open) sheet.showModal();
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
