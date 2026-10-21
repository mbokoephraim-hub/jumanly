"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A sheet of the phone interface (brief § 3, « Feuille »): the veil darkens, the sheet rises
 * 56 px from the bottom (340 ms). A <dialog>: focus stays inside, Échap or a touch on the veil
 * closes it. Controlled by its owner (`open`, `onClose`).
 */
export function PhoneSheet({
  open,
  onClose,
  label,
  closeLabel,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  /** Name of the dialog for screen readers (its visible title is in `children`). */
  label: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="nb-feuille-dlg"
      aria-label={label}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {open ? (
        <>
          <button type="button" className="nb-voile" aria-label={closeLabel} onClick={onClose} />
          <div className={className ? `nb-feuille ${className}` : "nb-feuille"}>
            <span className="nb-poignee" aria-hidden />
            {children}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
