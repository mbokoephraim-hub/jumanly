import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Icon, Logo, type IconName } from "@/components/brand";
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
  return (
    <aside className="hidden shrink-0 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:items-center lg:pl-4">
      <div className="jm-admin-rail flex w-[68px] flex-col items-center gap-1.5 px-3.5 py-3">
        <Link
          href={home}
          aria-label={homeLabel}
          className="jm-admin-link relative mb-1 grid size-10 place-items-center rounded-[13px]"
        >
          <Logo variant="tile" height={40} />
          <span aria-hidden className="jm-admin-tip">
            {homeTip}
          </span>
        </Link>
        <nav aria-label={label} className="flex flex-col items-center gap-1.5">
          {groups
            .filter(({ items }) => items.length > 0)
            .map((group, index) => (
              <Fragment key={group.label ?? index}>
                {index > 0 && <span aria-hidden className="jm-admin-sep" />}
                <ul aria-label={group.label} className="flex flex-col gap-0.5">
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
            <div className="flex flex-col items-center gap-0.5">{footer}</div>
          </>
        )}
      </div>
    </aside>
  );
}

/** A rail action that is not a navigation link (sign out): same look, tooltip and name. */
export function RailButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      className="jm-admin-link relative grid size-10 place-items-center rounded-full text-blanc/75 transition-colors hover:bg-blanc/12 hover:text-blanc [&_svg]:size-[21px]"
    >
      <Icon name={icon} />
      <span aria-hidden className="jm-admin-tip">
        {label}
      </span>
    </button>
  );
}
