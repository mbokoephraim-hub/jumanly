"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { pagesSeen } from "../pages-seen";

/**
 * « Retour » of a candidate's file (Ephraïm, 03/11/2026): one step back, to the list the recruiter
 * came from, never through every file or state seen on the way (those replace the page). A file
 * opened directly (a link, a notification) goes to `href`, in place of the current page.
 */
export function useRhBack(href: string) {
  const router = useRouter();
  return () => {
    if (pagesSeen() > 1) router.back();
    else router.replace(href);
  };
}

export function RhBackLink({
  href,
  className,
  label,
  children,
}: {
  href: string;
  className: string;
  label: string;
  children: ReactNode;
}) {
  const back = useRhBack(href);
  return (
    <Link
      href={href}
      replace
      className={className}
      aria-label={label}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        back();
      }}
    >
      {children}
    </Link>
  );
}
