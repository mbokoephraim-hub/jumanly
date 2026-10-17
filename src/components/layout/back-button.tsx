"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/** Pages shown in this tab since it opened: more than one means « back » stays in Jumanly. */
let pagesSeen = 0;

/** Counts the pages of the signed-in space, from the shell (always mounted). */
export function useCountPages() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    pagesSeen += 1;
  }, [pathname]);
}

/**
 * « Retour » at the head of every page that is not a destination (docs/ux-mobile-talent V6 § B4):
 * a 42 px white button that goes back to the screen before, never to the home by surprise. When
 * the page was opened directly (no history in Jumanly), it goes to `fallback`, the parent page.
 * Without JavaScript it is a plain link to `fallback`.
 */
export function BackButton({
  fallback,
  label,
  history = true,
  className,
}: {
  fallback: string;
  label: string;
  /** false: always `fallback` (a page that knows exactly where « back » is). */
  history?: boolean;
  className?: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      aria-label={label}
      onClick={(event) => {
        if (!history || event.metaKey || event.ctrlKey || event.shiftKey) return;
        const fromJumanly =
          pagesSeen > 1 ||
          (window.history.length > 1 &&
            document.referrer !== "" &&
            new URL(document.referrer).origin === window.location.origin);
        if (!fromJumanly) return;
        event.preventDefault();
        router.back();
      }}
      className={cx(
        "jm-back grid size-[42px] shrink-0 place-items-center rounded-[15px]",
        className,
      )}
    >
      <Icon name="retour" className="size-[22px]" />
    </Link>
  );
}

/** The parent of a page: `/app/jobs/abc` → `/app/jobs`, `/app/espace` → `/app`. */
export function parentPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 2) return "/app";
  return `/${parts.slice(0, -1).join("/")}`;
}
