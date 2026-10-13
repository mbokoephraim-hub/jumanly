"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

/** Modal built on the native <dialog> element (focus trap and Escape handled by the browser). */
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const t = useTranslations("ui");
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-blanc p-0 text-sapin shadow-card backdrop:bg-nuit/50"
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-2">
        <h2 id={titleId} className="text-h2">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="rounded-full p-2 text-ardoise hover:bg-sapin/8 hover:text-sapin"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="px-6 pb-6 text-[15px] leading-6 text-ardoise">{children}</div>
      {actions && (
        <div className="flex flex-col-reverse gap-3 border-t border-brume px-6 py-4 sm:flex-row sm:justify-end">
          {actions}
        </div>
      )}
    </dialog>
  );
}
