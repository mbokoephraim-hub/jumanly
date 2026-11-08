"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";

export type RecruiterToolsGroup = {
  title: string;
  items: { href: string; label: string; icon: TalentIconName; exact?: boolean }[];
};

/**
 * The recruiter's computer (Ephraïm, 08/11/2026: « une interface approfondie avec d'autres
 * outils »): under the five tabs of the phone, the tools a phone cannot hold (reports, message
 * templates) and, for the owner and the administrators, the company's part (web only).
 */
export function RecruiterToolsNav({ groups }: { groups: RecruiterToolsGroup[] }) {
  const pathname = usePathname();
  const on = (item: RecruiterToolsGroup["items"][number], items: RecruiterToolsGroup["items"]) => {
    if (item.exact) {
      // « Page entreprise » (/app/organisation) is lit unless another item of the group is.
      const inside = pathname === item.href || pathname.startsWith(`${item.href}/`);
      return (
        inside &&
        !items.some(
          (other) =>
            other !== item && (pathname === other.href || pathname.startsWith(`${other.href}/`)),
        )
      );
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };
  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="nb-nav-outils">
          <p className="nb-nav-titre" aria-hidden>
            {group.title}
          </p>
          <nav aria-label={group.title}>
            <ul>
              {group.items.map((item) => {
                const current = on(item, group.items);
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={current ? "page" : undefined}>
                      <TalentIcon name={item.icon} size="s" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ))}
    </>
  );
}
