"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Copies a text to the clipboard and says so (the text stays selectable on the page). */
export function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={copy}>
        {label}
      </Button>
      <span role="status" className="text-sm text-feuille-fonce">
        {copied ? copiedLabel : ""}
      </span>
    </span>
  );
}
