"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { closeDialog } from "../web/dialog";

/** Where the web frame starts (docs/refonte-web, brief § 0): tablet and computer. */
const WIDE = "(min-width: 768px)";

/**
 * A link to a screen of the profile (planche web talent-4 § 4): on a phone, its own page
 * (`href`); on a tablet or a computer, the window or the panel over « Mon profil » (`wide`, an
 * address of the profile with `?fenetre=`). Without JavaScript, the page.
 */
export function WideLink({
  href,
  wide,
  children,
  ...rest
}: ComponentProps<typeof Link> & { href: string; wide: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        if (!window.matchMedia(WIDE).matches) return;
        event.preventDefault();
        router.push(wide, { scroll: false });
      }}
    >
      {children}
    </Link>
  );
}

/** « Annuler » of a window: closes it, nothing is sent. */
export function WindowClose({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => closeDialog(event.currentTarget)}
    >
      {children}
    </button>
  );
}

/**
 * The sections of « Mon profil » stay folded on a phone (one open at a time is enough) and all
 * open on a tablet or a computer, where the two columns show everything (planche web talent-4 § 4).
 */
export function OpenSectionsOnWide({ selector }: { selector: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !window.matchMedia(WIDE).matches) return;
    done.current = true;
    document.querySelectorAll<HTMLDetailsElement>(selector).forEach((node) => {
      node.open = true;
    });
  }, [selector]);
  return null;
}
