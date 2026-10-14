import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Title of a signed-in page (mockups 03-*). On wide screens it rises into the shell's top bar,
 * on the left of the space switcher and the account pill.
 */
export function AppPageHeader({
  eyebrow,
  title,
  actions,
  titleAs: Title = "h1",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  /** "p" when the page's h1 is further down (the lesson title in the player). */
  titleAs?: "h1" | "p";
  className?: string;
}) {
  return (
    <header
      className={cx(
        "flex flex-wrap items-end justify-between gap-3 lg:min-h-[58px] lg:first:-mt-[74px] lg:first:max-w-[calc(100%-470px)]",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        {eyebrow && <p className="text-xs text-ardoise lg:text-[13px]">{eyebrow}</p>}
        <Title className="text-[24px] leading-[1.15] font-bold tracking-tight lg:text-[28px]">
          {title}
        </Title>
      </div>
      {actions}
    </header>
  );
}
