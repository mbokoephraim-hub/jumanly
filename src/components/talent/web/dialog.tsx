"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { TalentIcon } from "../icon";

type Common = {
  /** Id of the <dialog>: `DialogButton target` opens it. */
  id: string;
  /** Name of the window, read by screen readers; shown unless `titleHidden`. */
  title: string;
  titleHidden?: boolean;
  /** Label of the round « Fermer » button. */
  closeLabel: string;
  /** Short line under the title (`.dlg .ss`). */
  subtitle?: ReactNode;
  /** Opens when the address carries this parameter; removed on closing (Retour does not reopen it). */
  openParam?: string;
  /** Open on the first paint (an answer of a form that comes back to the window). */
  defaultOpen?: boolean;
  /** Replaces the title row (Orbi's head, a person's card). The title stays for screen readers. */
  head?: ReactNode;
  /**
   * Controlled opening (the Orbi panel follows `?orbi=` in the address). Leave it out to open with
   * `DialogButton`, `openParam` or `defaultOpen`.
   */
  open?: boolean;
  /** No title row: the content draws its own head and its own close button (`closeDialog`). */
  bare?: boolean;
  /** Called once the window is closed (Échap, the veil, « Fermer », `close()`). */
  onClose?: () => void;
  className?: string;
  children: ReactNode;
};

/**
 * Shared body of the web windows (docs/refonte-web, brief § 2.5). A native modal <dialog>: the page
 * behind becomes inert (focus stays inside), `Échap` closes, focus goes back to the button that
 * opened it. A click on the veil closes too.
 */
function WebDialog({
  id,
  title,
  titleHidden = false,
  closeLabel,
  subtitle,
  openParam,
  defaultOpen = false,
  head,
  onClose,
  open,
  bare = false,
  className,
  children,
  variant,
}: Common & { variant: "fenetre" | "volet" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node || node.open) return;
    const fromAddress = openParam && new URL(window.location.href).searchParams.has(openParam);
    if (defaultOpen || fromAddress) node.showModal();
  }, [defaultOpen, openParam]);
  useEffect(() => {
    const node = dialog.current;
    if (!node || open === undefined) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      id={id}
      className={cx(variant === "fenetre" ? "t-fenetre" : "t-volet", className)}
      aria-labelledby={`${id}-t`}
      onClose={() => {
        if (openParam) {
          const url = new URL(window.location.href);
          if (url.searchParams.has(openParam)) {
            url.searchParams.delete(openParam);
            window.history.replaceState(window.history.state, "", url);
          }
        }
        onClose?.();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      {bare ? (
        <h2 id={`${id}-t`} className="sr-only">
          {title}
        </h2>
      ) : (
        <div className="t-dlg-tete">
          {head ? (
            <>
              <h2 id={`${id}-t`} className="sr-only">
                {title}
              </h2>
              <div className="min-w-0 flex-1">{head}</div>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <h2 id={`${id}-t`} className={cx(titleHidden && "sr-only")}>
                {title}
              </h2>
              {subtitle && <p className="t-ss">{subtitle}</p>}
            </div>
          )}
          <button
            type="button"
            className="t-bi t-press t-dlg-x"
            aria-label={closeLabel}
            onClick={() => dialog.current?.close()}
          >
            <TalentIcon name="fermer" size="s" />
          </button>
        </div>
      )}
      {children}
    </dialog>
  );
}

/**
 * Centred window of the web frame (planche web.py `.dlg`): a choice or a confirmation that is a
 * bottom sheet on a phone. 520 px wide (`className` can widen it), veil Nuit at 30 %.
 */
export function CenteredDialog(props: Common) {
  return <WebDialog {...props} variant="fenetre" />;
}

/**
 * Side panel of the web frame (planche web.py `.op`): 420 px on the right (440 px on a tablet), full
 * height, the page stays visible on the left. For a member's card, a quick file, Orbi.
 */
export function SidePanel(props: Common) {
  return <WebDialog {...props} variant="volet" />;
}

/** Closes the window or panel that holds `element` (a close button drawn by a `bare` content). */
export function closeDialog(element: Element) {
  element.closest("dialog")?.close();
}

/** Opens the window or panel `target`; inside another one, that one closes first. */
export function DialogButton({
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
        const node = document.getElementById(target);
        if (node instanceof HTMLDialogElement && !node.open) node.showModal();
      }}
    >
      {children}
    </button>
  );
}
