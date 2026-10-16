import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/**
 * Jumanly AI identity (planche « Boutons »): night aurora, iridescent ring, Lime sparkle. Reserved
 * to the AI, never lent to an ordinary button. `solid` asks the AI (« Améliorer »), `suggestion` is
 * a starting suggestion (« Analyser les exigences »).
 */
const tones = {
  solid: "jm-ai-surface text-blanc [&_svg]:text-lime",
  suggestion: "jm-ai-outline text-sapin [&_svg]:text-feuille-fonce",
};
const sizes = {
  S: "h-9 px-3.5 text-[13px] gap-1.5 touch-target [&_svg]:size-4",
  M: "h-11 px-4 text-sm gap-2 [&_svg]:size-[18px]",
  L: "h-[52px] px-5 text-[15px] gap-2.5 [&_svg]:size-5",
};

type ChipStyle = { tone?: keyof typeof tones; size?: keyof typeof sizes; children: ReactNode };

function chipClasses(tone: keyof typeof tones, size: keyof typeof sizes, className?: string) {
  return cx(
    "jm-press inline-flex shrink-0 items-center justify-center rounded-pill font-semibold whitespace-nowrap",
    "transition-[filter,transform] hover:brightness-110 disabled:pointer-events-none disabled:opacity-45",
    tones[tone],
    sizes[size],
    className,
  );
}

/** The sparkle of Jumanly AI. */
export function AiSpark({ className }: { className?: string }) {
  return <Icon name="intelligence" className={className} />;
}

/** A Jumanly AI action inside a page: a button, or a link when `href` is given. */
export function AiChip({
  tone = "solid",
  size = "S",
  className,
  children,
  ...rest
}: ChipStyle & { className?: string } & (
    | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">)
    | ({ href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">)
  )) {
  const content = (
    <>
      <AiSpark />
      {children}
    </>
  );
  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link className={chipClasses(tone, size, className)} {...rest}>
        {content}
      </Link>
    );
  }
  const { type = "button", ...buttonRest } = rest as ComponentProps<"button">;
  return (
    <button type={type} className={chipClasses(tone, size, className)} {...buttonRest}>
      {content}
    </button>
  );
}

/**
 * The AI signature mark: Lime orb with its sparkle, the « Jumanly » word and the « AI » tag. Used
 * on the AI bento card and, later, the floating button and the panel header.
 */
export function AiSignature({
  brand,
  tag,
  className,
}: {
  brand: string;
  tag: string;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-semibold text-blanc", className)}>
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-full bg-ai-orb text-sapin shadow-orb"
      >
        <AiSpark className="size-[18px]" />
      </span>
      {brand}
      <span className="rounded-[6px] bg-lime px-1.5 py-px text-[11px] font-bold text-sapin">
        {tag}
      </span>
    </span>
  );
}
