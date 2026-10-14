"use client";

import { Icon } from "@/components/brand/icon";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Mobile drawer (§ 11.5): a sheet that slides up from the bottom on mobile and sits on the
 * right on large screens. Native <dialog>: focus trap and Escape come from the browser.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
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
      className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none rounded-t-panel bg-creme p-0 text-sapin shadow-float backdrop:bg-nuit/45 lg:mr-0 lg:ml-auto lg:h-dvh lg:max-h-none lg:w-md lg:rounded-t-none lg:rounded-l-panel"
    >
      <div className="flex h-full flex-col">
        <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 rounded-pill bg-brume lg:hidden" />
        <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-2">
          <h2 id={titleId} className="text-app-h2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeDialog")}
            className="touch-target flex size-8 items-center justify-center rounded-full bg-blanc text-sapin hover:bg-brume"
          >
            <Icon name="fermer" className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex gap-3 border-t border-brume px-6 py-4">{footer}</div>}
      </div>
    </dialog>
  );
}
