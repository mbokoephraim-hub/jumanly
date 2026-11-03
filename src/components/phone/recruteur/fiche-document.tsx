"use client";

import Link from "next/link";
import { useState } from "react";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

/**
 * « Consulter » of a document card (Ephraïm, 03/11/2026): it opens the piece itself, never the old
 * candidate file. A text (the letter, a joined text) opens in a sheet on the profile; a file (the
 * CV in PDF, an attestation) opens directly in a new tab.
 */
export function RhDocumentOpen({
  label,
  ariaLabel,
  first,
  title,
  text,
  href,
  external,
  closeLabel,
}: {
  label: string;
  ariaLabel: string;
  first: boolean;
  title: string;
  /** The text to read in the sheet; null opens `href`. */
  text: string | null;
  href: string;
  /** A file (PDF, attestation): a new tab, so the profile stays open behind it. */
  external: boolean;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const content = (
    <>
      {label}
      <PhoneIcon name="chevron" size={12} />
    </>
  );
  if (text === null)
    return external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="nb-rh-fd-go"
        data-premier={first ? "" : undefined}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    ) : (
      <Link
        href={href}
        className="nb-rh-fd-go"
        data-premier={first ? "" : undefined}
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
  return (
    <>
      <button
        type="button"
        className="nb-rh-fd-go"
        data-premier={first ? "" : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        {content}
      </button>
      <PhoneSheet open={open} onClose={() => setOpen(false)} label={title} closeLabel={closeLabel}>
        <div className="nb-rh-fd-lecture">
          <h2 className="nb-rh-feuille-t">{title}</h2>
          <p>{text}</p>
        </div>
      </PhoneSheet>
    </>
  );
}
