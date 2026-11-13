"use client";

import { useEffect } from "react";

/** Opens the print window once the document is shown (« Télécharger le PDF »). */
export function HireAutoPrint() {
  useEffect(() => {
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
