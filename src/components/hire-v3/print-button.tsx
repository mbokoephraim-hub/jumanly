"use client";

import { HireIcon } from "./icon";

/** « Enregistrer en PDF » of a report (`#rpprint` of the prototype): the browser's print window. */
export function HirePrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn pri" onClick={() => window.print()}>
      <HireIcon name="dl" />
      {label}
    </button>
  );
}
