"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { activeLink, sectionIndex, type Section } from "@/config/section-navigation";
import { cx } from "@/lib/cx";

/**
 * Secondary horizontal menu (Admin v4, étape 2): the sub-sections of the current section, as thin
 * tabs; the current one is underlined. Scrolls sideways on a phone. Nothing for a section without
 * sub-sections.
 */
export function SectionNav({ sections, className }: { sections: Section[]; className?: string }) {
  const pathname = usePathname();
  const section = sections[sectionIndex(sections, pathname)];
  if (!section || section.links.length < 2) return null;
  const current = activeLink(section.links, pathname);
  return (
    <nav aria-label={section.label} className={cx("min-w-0", className)}>
      <ul className="jm-section-tabs flex gap-1 overflow-x-auto">
        {section.links.map((link, index) => (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              aria-current={index === current ? "page" : undefined}
              className={cx(
                "relative flex h-10 items-center rounded-pill px-3.5 text-[13.5px] whitespace-nowrap transition-colors",
                index === current
                  ? "jm-section-tab-on font-semibold text-sapin"
                  : "font-medium text-ardoise hover:bg-sapin/5 hover:text-sapin",
              )}
            >
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
