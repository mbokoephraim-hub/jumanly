"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Copies a text to the clipboard and says so (the text stays selectable on the page). */
export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
  icon,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  /** Own look (Career pills) instead of the secondary button. */
  className?: string;
  icon?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {className ? (
        <button type="button" className={className} onClick={copy}>
          {icon}
          {label}
        </button>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={copy}>
          {label}
        </Button>
      )}
      <span role="status" className="text-sm text-feuille-fonce">
        {copied ? copiedLabel : ""}
      </span>
    </span>
  );
}
