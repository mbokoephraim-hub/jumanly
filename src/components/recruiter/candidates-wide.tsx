"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

const WIDE = "(min-width: 1200px)";

/**
 * The list and the file side by side on a large screen (web recruteur lot 2, planche `.ats`): a
 * candidate of the list opens beside it (`?id=`) instead of on its own page, so the recruiter goes
 * from one person to the next without leaving the list. Below 1200 px the links lead to the file as
 * on a phone, and a list address that carries a file opens that file.
 */
export function CandidatesWide({
  selected,
  children,
}: {
  selected: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected || window.matchMedia(WIDE).matches) return;
    router.replace(`/app/hire/candidats/${encodeURIComponent(selected)}`);
  }, [selected, router]);

  return (
    <div
      ref={box}
      className="t-rw-lst"
      // Capture phase: the row's own link must not navigate first.
      onClickCapture={(event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!window.matchMedia(WIDE).matches) return;
        const link =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>("a[data-rc-id]")
            : null;
        if (!link || !box.current?.contains(link)) return;
        event.preventDefault();
        event.stopPropagation();
        const url = new URL(window.location.href);
        url.searchParams.set("id", link.dataset.rcId!);
        url.searchParams.delete("ok");
        router.push(`${url.pathname}?${url.searchParams}`, { scroll: false });
      }}
    >
      {children}
    </div>
  );
}
