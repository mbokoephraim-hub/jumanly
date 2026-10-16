"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { universe, universeFor, type UniverseKey } from "@/config/universes";
import { cx } from "@/lib/cx";

/**
 * Title of each signed-in page. Admin v4, étape 3 (inspired by Patreon's creator pages): a plain
 * title on the light page, no banner. A small tile in the column's gradient carries the module's
 * icon; the eyebrow and one line of subtitle sit around the title, the page actions on the right.
 * The title appears word by word when the page opens.
 */
export function UniverseHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  titleAs: Title = "h1",
  module,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** One line under the title (a count, the organization…). */
  subtitle?: ReactNode;
  actions?: ReactNode;
  titleAs?: "h1" | "p";
  /** Universe of the page; by default the one of the current path. */
  module?: UniverseKey;
  /** Former banner character: no longer shown (Admin v4, étape 3). */
  illustration?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const world = module ? universe(module) : universeFor(pathname);
  const words = typeof title === "string" ? title.split(/(\s+)/) : null;
  return (
    <header
      data-universe={world.key}
      className={cx(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pt-1 pb-1 lg:pt-2",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3 lg:gap-3.5">
        <span
          aria-hidden
          className="jm-title-tile hidden size-10 shrink-0 items-center justify-center rounded-[13px] text-blanc sm:flex [&_svg]:size-5"
        >
          <Icon name={world.icon} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          {eyebrow && <p className="text-[12.5px] leading-4 text-ardoise">{eyebrow}</p>}
          <Title className="text-[24px] leading-[1.2] font-semibold tracking-[-0.02em] lg:text-[28px]">
            {words
              ? words.map((word, index) =>
                  /^\s+$/.test(word) ? (
                    word
                  ) : (
                    <span
                      key={index}
                      className="jm-uword inline-block"
                      style={{ "--i": index / 2 } as React.CSSProperties}
                    >
                      {word}
                    </span>
                  ),
                )
              : title}
          </Title>
          {subtitle && <div className="text-[13.5px] leading-5 text-ardoise">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Pattern of the module, very light, behind the top of the Crème page (§ 1). */
export function UniverseBackdrop() {
  const world = universeFor(usePathname());
  if (!world.pattern) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden rounded-t-[inherit]"
      style={{
        backgroundImage: `url(/marque/motifs/motif-${world.pattern}-clair.svg)`,
        backgroundSize: "600px",
        opacity: 0.08,
        maskImage: "linear-gradient(#000 0%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(#000 0%, transparent 100%)",
      }}
    />
  );
}
