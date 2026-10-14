"use client";

import { Icon } from "@/components/brand/icon";

/** Prints the current page (legal pages). */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme print:hidden"
    >
      <Icon name="telecharger" className="size-4" />
      {label}
    </button>
  );
}
