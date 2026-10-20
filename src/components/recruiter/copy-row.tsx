"use client";

import type { ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";

/** « Copier le lien de l'annonce »: the address goes to the clipboard, a toast confirms it. */
export function CopyRow({
  value,
  copied,
  className,
  label,
  children,
}: {
  value: string;
  copied: string;
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      data-value={value}
      onClick={async () => {
        await navigator.clipboard?.writeText(value).catch(() => undefined);
        showToast({ message: copied, tone: "success" });
      }}
    >
      {children}
    </button>
  );
}
