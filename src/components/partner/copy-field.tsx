"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** A read-only address with a copy button (the address stays selectable without JavaScript). */
export function CopyField({
  id,
  label,
  value,
  copyLabel,
  copiedLabel,
}: {
  id: string;
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
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
