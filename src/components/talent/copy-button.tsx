"use client";

import type { ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";

/** « Copier » (planche talent-3, partager une attestation): the address goes to the clipboard. */
export function CopyButton({
  value,
  label,
  copied,
  className,
  children,
}: {
  value: string;
  label: string;
  copied: string;
  className?: string;
  /** An icon instead of the word: `label` becomes the button's name. */
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={children ? label : undefined}
      title={children ? label : undefined}
      onClick={async () => {
        await navigator.clipboard?.writeText(value).catch(() => undefined);
        showToast({ message: copied, tone: "success" });
      }}
    >
      {children ?? label}
    </button>
  );
}
