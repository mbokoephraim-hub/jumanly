"use client";

import { Icon } from "@/components/brand/icon";
import type { ReactNode } from "react";
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

/** Sapin toast (mockup 00-02): floating, check in a Lime disc, optional action such as "Annuler". */
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
    <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[16px] bg-sapin py-2 pr-2 pl-[18px] text-blanc shadow-float">
      <span
        aria-hidden
        className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-lime text-sapin"
      >
        <Icon name="check" className="size-3.5" />
      </span>
      <p className="flex-1 py-1.5 text-sm leading-5">{message}</p>
      {action}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-blanc/10"
        >
          <Icon name="fermer" className="size-5" />
        </button>
      )}
    </div>
  );
}
