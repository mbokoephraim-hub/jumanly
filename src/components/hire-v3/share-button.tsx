"use client";

import { showToast } from "@/components/motion/toaster";
import { HireIcon } from "./icon";

/** « Partager » of an offer card: copies the public address of the offer. */
export function HireShareButton({
  path,
  label,
  done,
  wide = false,
  className,
}: {
  /** Another look for the written-out button (`.btn.ghost` of a page head). */
  className?: string;
  path: string;
  label: string;
  done: string;
  /** « Copier le lien » written out (`.btn.sm.dark` of « Partage »). */
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={className ?? (wide ? "btn sm dark" : "round")}
      aria-label={wide ? undefined : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
          showToast({ message: done, tone: "success" });
        } catch {
          window.open(path, "_blank", "noopener");
        }
      }}
    >
      <HireIcon name={wide ? "link" : "share2"} size="s" />
      {wide ? label : null}
    </button>
  );
}
