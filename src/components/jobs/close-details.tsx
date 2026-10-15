"use client";

import type { ReactNode } from "react";

/** Button that closes the `<details>` it sits in (the filter sheet covers its own summary). */
export function CloseDetails({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
      className="flex size-10 items-center justify-center rounded-full bg-blanc lg:bg-creme"
    >
      {children}
    </button>
  );
}
