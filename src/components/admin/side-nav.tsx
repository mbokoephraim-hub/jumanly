"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";

export type AdminSideGroup = {
  label: string;
  items: readonly { key: string; href: string; icon: IconName; label: string }[];
};

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Side navigation of the platform admin (Modèle B, like the recruiter space on a computer): groups
 * with a small capital label, one line per section, the current one on a lighter ground with a
 * Lime icon. From 768 to 1199 px only the icons show (the label stays for screen readers).
 */
export function AdminSideNav({ label, groups }: { label: string; groups: AdminSideGroup[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex flex-col gap-4">
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p className="jm-adm-side-label px-3 pb-1 text-[10.5px] font-semibold tracking-[0.1em] text-[#7e938e] uppercase">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    title={item.label}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="jm-adm-side-link flex h-9 items-center gap-3 rounded-[12px] px-3 text-[13.5px] font-medium max-[1199.98px]:justify-center"
                  >
                    <Icon name={item.icon} className="size-[19px] shrink-0" />
                    <span className="jm-adm-side-label truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </nav>
  );
}
