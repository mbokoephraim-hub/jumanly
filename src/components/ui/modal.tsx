"use client";

import { Icon } from "@/components/brand/icon";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Modal built on the native <dialog> element (focus trap and Escape handled by the browser).
 * Mockup 00-02: Nuit veil at 45 %, white card with 28 px corners, round Crème close button.
 */
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
  const t = useTranslations("a11y");
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
      className="m-auto w-[calc(100%-2rem)] max-w-[440px] rounded-card bg-blanc p-0 text-sapin shadow-float backdrop:bg-nuit/45"
    >
      <div className="flex items-start justify-between gap-4 px-[26px] pt-[26px] pb-3.5">
        <h2 id={titleId} className="text-app-h2">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeDialog")}
          className="touch-target flex size-8 shrink-0 items-center justify-center rounded-full bg-creme text-sapin hover:bg-brume"
        >
          <Icon name="fermer" className="size-4" />
        </button>
      </div>
      <div className="px-[26px] pb-[26px] text-sm leading-5 text-ardoise">{children}</div>
      {actions && (
        <div className="-mt-3 flex flex-col-reverse gap-2.5 px-[26px] pb-[26px] sm:flex-row sm:justify-end">
          {actions}
        </div>
      )}
    </dialog>
  );
}
