"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { activeLink, sectionIndex, type Section } from "@/config/section-navigation";
import { cx } from "@/lib/cx";

/**
 * Secondary horizontal menu (Admin v4, étapes 2 and 7): the sub-sections of the current section,
 * as tabs with their icon in a white pill bar; the current one is filled with Sapin. Scrolls sideways on a phone. Nothing for a section without
 * sub-sections. On a phone the talent tabs (`phoneHidden`) go without it, like the mockups: their
 * pages lead to the same places.
 */
export function SectionNav({
  sections,
  className,
  phoneHidden,
}: {
  sections: Section[];
  className?: string;
  phoneHidden?: readonly string[];
}) {
  const pathname = usePathname();
  const section = sections[sectionIndex(sections, pathname)];
  if (!section || section.links.length < 2) return null;
  const current = activeLink(section.links, pathname);
  return (
    <nav
      aria-label={section.label}
      data-phone-hidden={phoneHidden?.includes(pathname) || undefined}
      className={cx("min-w-0", className)}
    >
      <ul className="jm-section-tabs flex w-fit max-w-full gap-1 overflow-x-auto rounded-pill p-1">
        {section.links.map((link, index) => (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              aria-current={index === current ? "page" : undefined}
              className={cx(
                "relative flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[13.5px] whitespace-nowrap transition-colors",
                index === current
                  ? "jm-section-tab-on font-semibold text-blanc"
                  : "font-medium text-sapin/80 hover:bg-creme hover:text-sapin",
              )}
            >
              {link.icon && <Icon name={link.icon} className="size-4 shrink-0" />}
              {link.label}
              {link.locked && (
                <>
                  <Icon name="lock" className="ml-1.5 size-[13px] opacity-55" />
                  <span className="sr-only">{section.lockedLabel}</span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
