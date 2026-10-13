"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Link of the signed-in space, highlighted when its page is open. */
export function NavLink({
  href,
  icon,
  label,
  placement,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  placement: "sidebar" | "bottom-bar";
}) {
  const active = isActive(usePathname(), href);
  const sidebar = placement === "sidebar";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex items-center transition-colors",
        sidebar
          ? "h-11 gap-3 rounded-pill px-4 text-[15px] font-medium"
          : "h-full flex-1 flex-col justify-center gap-1 text-[11px] font-medium",
        sidebar &&
          (active ? "bg-lime text-sapin" : "text-blanc/75 hover:bg-blanc/8 hover:text-blanc"),
        !sidebar && (active ? "text-sapin" : "text-ardoise"),
      )}
    >
      <span className={cx(!sidebar && "rounded-pill px-4 py-1", !sidebar && active && "bg-lime")}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
