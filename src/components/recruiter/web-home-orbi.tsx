"use client";

import { openOrbiPanel } from "@/components/talent/web/orbi-panel";

/** « Ouvrir la conversation complète » of « Orbi résume »: Orbi's panel, the page stays. */
export function OrbiOpenLink({ label }: { label: string }) {
  return (
    <button type="button" className="rb-lien" onClick={() => openOrbiPanel()}>
      {label}
    </button>
  );
}
