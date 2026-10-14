"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Filter card of the public lists (/formations, /offres): always open on wide screens, folded
 * behind its « Filtrer » summary on phones. Without JavaScript it stays as the server sent it.
 */
export function FilterPanel({
  summary,
  open,
  className,
  children,
}: {
  summary: ReactNode;
  open?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (wide.matches && ref.current) ref.current.open = true;
    };
    sync();
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);
  return (
    <details ref={ref} open={open} className={className}>
      {summary}
      {children}
    </details>
  );
}
