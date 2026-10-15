import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/**
 * Badge in the top right corner of a card's illustration (BRIEF-CAREER-V2 § 4): included by the
 * free plan, the plan that opens a locked tool (Sapin for the first paid level, Nuit above), or
 * coming soon. Always written, never a colour alone.
 */
export type ToolBadge =
  | { kind: "included"; label: string }
  | { kind: "locked"; label: string; entry: boolean }
  | { kind: "soon"; label: string };

export function Badge({ badge }: { badge: ToolBadge }) {
  return (
    <span
      className={cx(
        "absolute top-3.5 right-3.5 z-[2] inline-flex items-center gap-1.5 rounded-pill py-1.5 pr-[11px] pl-[9px] text-[11px] font-semibold tracking-[0.02em]",
        badge.kind === "included" && "bg-lime pl-[11px] text-sapin",
        badge.kind === "locked" &&
          (badge.entry
            ? "bg-sapin text-lime"
            : "bg-nuit text-neon shadow-[inset_0_0_0_1px_rgb(227_246_124/0.4)]"),
        badge.kind === "soon" && "bg-blanc/85 text-ardoise backdrop-blur-md",
      )}
    >
      {badge.kind === "locked" && <Icon name="lock" className="size-[13px]" />}
      {badge.kind === "soon" && <Icon name="horloge" className="size-[13px]" />}
      {badge.label}
    </span>
  );
}

export const cardShadow =
  "shadow-[0_1px_0_rgb(15_63_55/0.04),0_18px_40px_-22px_rgb(15_63_55/0.35)]";

/** The link at the bottom right of a card, with its chevron that moves on hover. */
export function ToolLink({
  href,
  children,
  tone = "light",
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "dark" | "muted";
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap hover:underline lg:min-h-0",
        tone === "light" && "text-up-texte",
        tone === "dark" && "text-lime",
        tone === "muted" && "text-ardoise",
      )}
    >
      {children}
      <Icon name="chev-r" className="jm-ch-chev size-4" />
    </Link>
  );
}

/**
 * A Career tool (BRIEF-CAREER-V2 § 4): the illustration on top, then the body with its icon,
 * title, description, extras and footer (real state on the left, action on the right). A locked
 * tool keeps its illustration under a white veil and its icon turns Brume.
 */
export function CareerToolCard({
  id,
  href,
  title,
  description,
  icon,
  art,
  badge,
  state,
  action,
  extras,
  locked = false,
  soon = false,
  stretchArt = false,
  className,
}: {
  id: string;
  /** The tool's page; null while the tool does not exist yet. A locked tool shows its own lock. */
  href: string | null;
  title: string;
  description: string;
  icon: IconName;
  art: ReactNode;
  badge?: ToolBadge;
  state: ReactNode;
  action?: ReactNode;
  extras?: ReactNode;
  locked?: boolean;
  soon?: boolean;
  /** The illustration takes the free height (Mon CV, on two rows), not the body. */
  stretchArt?: boolean;
  className?: string;
}) {
  return (
    <article
      id={id}
      aria-labelledby={`${id}-title`}
      className={cx(
        "jm-ch-card relative flex min-w-0 flex-col overflow-hidden rounded-[28px]",
        soon
          ? "border-[1.5px] border-dashed border-sapin/18 bg-blanc/55"
          : cx("bg-blanc", cardShadow),
        locked && "jm-ch-locked",
        className,
      )}
    >
      {badge && <Badge badge={badge} />}
      {art}
      <div className={cx("flex flex-col gap-2 px-[22px] pt-5 pb-[18px]", !stretchArt && "flex-1")}>
        <div className="flex items-center gap-3">
          <span
            className={cx(
              "grid size-[38px] shrink-0 place-items-center rounded-xl",
              locked || soon ? "bg-brume" : "bg-lime-clair",
            )}
          >
            <Icon name={icon} className="size-5" />
          </span>
          <h3 id={`${id}-title`} className="text-lg leading-tight font-semibold">
            {href ? (
              <Link href={href} className="underline-offset-4 hover:underline">
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
        </div>
        <p className="max-w-[52ch] text-[13.5px] leading-[1.55] text-ardoise">{description}</p>
        {extras}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-brume pt-3.5">
          <div className="flex min-w-[120px] flex-col gap-1.5 text-xs text-ardoise">{state}</div>
          {action}
        </div>
      </div>
    </article>
  );
}
