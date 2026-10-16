import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Icon, Logo, type IconName } from "@/components/brand";
import { cx } from "@/lib/cx";
import { NavLink } from "./nav-link";

export type RailItem = { key: string; href: string; icon: IconName; label: string };

/**
 * Floating gradient column of icons (Admin v3, étape 1), shared by Jumanly Admin and the signed-in
 * space since Admin v4, étape 2: as tall as its content, centered in the window, rounded at both
 * ends; each label shows in a tooltip and names the link for screen readers.
 */
export function IconRail({
  home,
  homeLabel,
  homeTip,
  label,
  groups,
  footer,
}: {
  home: string;
  homeLabel: string;
  homeTip: string;
  /** Names the navigation for screen readers. */
  label: string;
  /** Groups of links, parted by a small dot; a group with a label is a named list. */
  groups: readonly { label?: string; items: readonly RailItem[] }[];
  /** Below a last dot: settings, sign out, back to the app… */
  footer?: ReactNode;
}) {
  // A long menu (Jumanly Admin) keeps the compact spacing so the column fits a laptop screen.
  const dense = groups.reduce((total, group) => total + group.items.length, 0) > 9;
  return (
    <aside className="hidden shrink-0 md:sticky md:top-0 md:z-40 md:flex md:h-dvh md:items-center md:pl-3 lg:pl-4">
      <div
        className={cx(
          "jm-admin-rail flex w-[78px] flex-col items-center px-4",
          dense ? "jm-rail-dense gap-1.5 py-3" : "gap-3.5 py-6",
        )}
      >
        <Link
          href={home}
          aria-label={homeLabel}
          className="jm-admin-link relative mb-1.5 grid size-11 place-items-center rounded-[14px]"
        >
          <Logo variant="tile" height={44} />
          <span aria-hidden className="jm-admin-tip">
            {homeTip}
          </span>
        </Link>
        <nav
          aria-label={label}
          className={cx("flex flex-col items-center", dense ? "gap-1.5" : "gap-3.5")}
        >
          {groups
            .filter(({ items }) => items.length > 0)
            .map((group, index) => (
              <Fragment key={group.label ?? index}>
                {index > 0 && <span aria-hidden className="jm-admin-sep" />}
                <ul
                  aria-label={group.label}
                  className={cx("flex flex-col", dense ? "gap-0.5" : "gap-2")}
                >
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <NavLink
                        href={item.href}
                        label={item.label}
                        icon={<Icon name={item.icon} />}
                        placement="rail"
                      />
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}
        </nav>
        {footer && (
          <>
            <span aria-hidden className="jm-admin-sep" />
            <div className="flex flex-col items-center gap-1.5">{footer}</div>
          </>
        )}
      </div>
    </aside>
  );
}
