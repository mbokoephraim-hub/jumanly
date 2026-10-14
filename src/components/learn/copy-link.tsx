"use client";

import { useState } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/** Copies the full address of a page of the site (the verification page of an attestation). */
export function CopyLink({
  path,
  label,
  copiedLabel,
  className,
}: {
  path: string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard
      .writeText(new URL(path, window.location.origin).href)
      .catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={cx("inline-flex items-center gap-2", className)}
    >
      <Icon name={copied ? "check" : "lien"} className="size-4" />
      {copied ? copiedLabel : label}
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}
