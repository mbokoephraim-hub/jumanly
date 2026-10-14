"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { universe, universeFor, type UniverseKey } from "@/config/universes";
import { cx } from "@/lib/cx";

/**
 * Banner at the top of each signed-in page (docs/experience-animee § 1): the module's background,
 * a tint that slowly flows over it, a brand shape drifting with the scroll, then the icon, the
 * eyebrow and the title. The title appears word by word when the page opens.
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
  className?: string;
}) {
  const pathname = usePathname();
  const world = module ? universe(module) : universeFor(pathname);
  const dark = world.tone === "dark";
  const words = typeof title === "string" ? title.split(/(\s+)/) : null;
  return (
    <header
      data-universe={world.key}
      className={cx(
        "jm-universe relative isolate flex min-h-24 flex-wrap items-center justify-between gap-x-4 gap-y-3 overflow-hidden rounded-[28px] px-5 py-5 lg:min-h-[132px] lg:px-8 lg:py-6",
        dark ? "bg-sapin text-blanc" : "bg-blanc text-sapin ring-1 ring-sapin/8",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-right"
        style={{
          backgroundImage: `url(/marque/fonds/${world.background}-16x9.svg)`,
          opacity: dark ? 0.9 : 0.6,
        }}
      />
      <span
        aria-hidden
        className="jm-flow-slow absolute inset-0 -z-10"
        style={{ backgroundImage: world.tint }}
      />
      <span aria-hidden className="absolute inset-y-0 right-[8%] -z-10 hidden w-[180px] sm:block">
        <span
          className="jm-parallax block size-full bg-contain bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(/marque/formes/${world.shape}.svg)` }}
        />
      </span>
      <div className="flex min-w-0 items-center gap-3 lg:gap-4">
        <span
          aria-hidden
          className={cx(
            "hidden size-12 shrink-0 items-center justify-center rounded-[16px] sm:flex [&_svg]:size-6",
            dark ? "bg-blanc/12 text-lime ring-1 ring-blanc/20" : "bg-sapin text-lime",
          )}
        >
          <Icon name={world.icon} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          {eyebrow && (
            <p className={cx("text-xs lg:text-[13px]", dark ? "text-blanc/80" : "text-sapin/80")}>
              {eyebrow}
            </p>
          )}
          <Title className="text-[24px] leading-[1.15] font-bold tracking-tight lg:text-[30px]">
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
          {subtitle && (
            <div className={cx("text-sm lg:text-[15px]", dark ? "text-blanc/85" : "text-sapin/85")}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div
          className={cx(
            "flex flex-wrap gap-2",
            dark && "items-center rounded-[22px] bg-blanc/95 p-1.5 text-sapin",
          )}
        >
          {actions}
        </div>
      )}
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
