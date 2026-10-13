"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Link of the signed-in space (§ 11.4): icon above its label, active item on Lime.
 * `sidebar`: 92 px Sapin bar on desktop. `pill`: floating navigation on mobile.
 */
export function NavLink({
  href,
  icon,
  label,
  placement,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  placement: "sidebar" | "pill";
}) {
  const active = isActive(usePathname(), href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex flex-col items-center justify-center gap-1 font-medium transition-colors",
        placement === "sidebar"
          ? "h-16 w-[72px] rounded-md text-[11px] leading-4"
          : "h-14 flex-1 rounded-pill text-[10px] leading-3",
        active ? "bg-lime text-sapin" : "text-blanc/80 hover:bg-blanc/10 hover:text-blanc",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
