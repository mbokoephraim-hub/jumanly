"use client";

import { useState } from "react";
import { Icon } from "@/components/brand/icon";
import { Button } from "@/components/ui/button";

/**
 * A read-only address with a copy button (the address stays selectable without JavaScript).
 * `pill` (mockup 06-02): the address and a Sapin « Copier le lien » button in one Crème bar, the
 * label read by screen readers only.
 */
export function CopyField({
  id,
  label,
  value,
  copyLabel,
  copiedLabel,
  variant = "field",
}: {
  id: string;
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  variant?: "field" | "pill";
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  }
  if (variant === "pill") {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <div className="flex items-center gap-2 rounded-[14px] bg-creme py-1.5 pr-1.5 pl-4">
          <input
            id={id}
            readOnly
            value={value}
            className="h-11 min-w-0 flex-1 truncate bg-transparent text-[13px] font-medium outline-offset-2"
          />
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-pill bg-sapin px-4 text-[13px] font-semibold text-blanc hover:bg-sapin/90 lg:h-9"
          >
            <Icon name="clip" className="size-4" />
            {copyLabel}
          </button>
        </div>
        <span role="status" className="text-[12px] text-feuille-fonce empty:hidden">
          {copied ? copiedLabel : ""}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          readOnly
          value={value}
          className="h-11 min-w-0 flex-1 rounded-sm border border-brume bg-creme px-3 text-sm"
        />
        <Button type="button" size="sm" variant="secondary" onClick={copy}>
          {copyLabel}
        </Button>
      </div>
      <span role="status" className="text-sm text-feuille-fonce">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
}
