import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/**
 * The arrow in a round that ends a pressable row or tile (planche « États d'interaction »). It turns
 * Sapin while pressed and into a spinner when the page takes more than 300 ms (styled in
 * surfaces.css from the `data-nav-pending` mark set by NavigationFeedback).
 */
export function PressArrow({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cx("jm-pressable-arrow", className)}>
      <Icon name="chev-r" className="size-4" />
      <span className="jm-pressable-wait inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
    </span>
  );
}

type PressableProps = {
  /** Shows the arrow in a round at the end. */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

const base = "jm-pressable flex min-h-14 items-center gap-3 rounded-[20px] p-3 text-sapin";

/**
 * One pressable surface for the whole Talent space: a menu row, a tool tile, an offer card. A link
 * when `href` is given, otherwise a button. Same look and the same pressed state everywhere.
 */
export function Pressable({
  href,
  arrow = true,
  className,
  children,
  ...rest
}: PressableProps &
  (
    | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">)
    | ({ href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">)
  )) {
  const content = (
    <>
      {children}
      {arrow && <PressArrow className="ml-auto" />}
    </>
  );
  if (href !== undefined) {
    return (
      <Link
        href={href}
        className={cx(base, className)}
        {...(rest as Omit<ComponentProps<typeof Link>, "href">)}
      >
        {content}
      </Link>
    );
  }
  const { type = "button", ...buttonRest } = rest as ComponentProps<"button">;
  return (
    <button type={type} className={cx(base, "w-full text-left", className)} {...buttonRest}>
      {content}
    </button>
  );
}
