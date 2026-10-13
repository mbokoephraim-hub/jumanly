"use client";

import type { ReactNode } from "react";
import { CircleCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Live region for toasts. It must be in the page before a toast appears,
 * so that screen readers announce it.
 */
export function ToastRegion({ children }: { children?: ReactNode }) {
  const t = useTranslations("toast");
  return (
    <div
      role="region"
      aria-label={t("region.aria")}
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 lg:bottom-6"
    >
      {children}
    </div>
  );
}

/** Sapin toast (§ 11.5), with an optional action such as "Annuler". */
export function Toast({
  message,
  action,
  onClose,
}: {
  message: string;
  action?: ReactNode;
  onClose?: () => void;
}) {
  const t = useTranslations("toast");
  return (
    <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-md bg-sapin py-2 pr-2 pl-4 text-blanc">
      <CircleCheck aria-hidden className="size-5 shrink-0 text-lime" />
      <p className="flex-1 py-1.5 text-[15px]">{message}</p>
      {action}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-blanc/10"
        >
          <X aria-hidden className="size-5" />
        </button>
      )}
    </div>
  );
}
