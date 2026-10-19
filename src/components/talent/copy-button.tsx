"use client";

import { showToast } from "@/components/motion/toaster";

/** « Copier » (planche talent-3, partager une attestation): the address goes to the clipboard. */
export function CopyButton({
  value,
  label,
  copied,
  className,
}: {
  value: string;
  label: string;
  copied: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await navigator.clipboard?.writeText(value).catch(() => undefined);
        showToast({ message: copied, tone: "success" });
      }}
    >
      {label}
    </button>
  );
}
