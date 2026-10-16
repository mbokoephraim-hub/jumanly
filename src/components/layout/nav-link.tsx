"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navLinkClasses, type NavPlacement } from "./nav-link-styles";

function isActive(pathname: string, href: string) {
  return href === "/" || href === "/app" || href === "/app/hire" || href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Link of the signed-in space and of the admin, highlighted on the current page. */
export function NavLink({
  href,
  icon,
  label,
  placement,
}: {
  href: string;
  icon?: ReactNode;
  label: string;
  placement: NavPlacement;
}) {
  const active = isActive(usePathname(), href);
  const hideLabel = (placement === "pill" && !active) || placement === "rail";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={hideLabel ? label : undefined}
      className={navLinkClasses(placement, active)}
    >
      {icon}
      {!hideLabel && <span>{label}</span>}
      {placement === "rail" && (
        <span aria-hidden className="jm-admin-tip">
          {label}
        </span>
      )}
    </Link>
  );
}
