"use client";

import { useState } from "react";
import { Icon } from "@/components/brand/icon";
import { Button } from "@/components/ui/button";

/** Shares the current page (native share sheet on mobile, copy of the link otherwise). */
export function ShareButton({ label, copiedLabel }: { label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ url, title: document.title }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  }
  return (
    <>
      <Button variant="tertiary" icon={<Icon name="partager" className="size-4" />} onClick={share}>
        {label}
      </Button>
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
