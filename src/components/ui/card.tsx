import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/**
 * Hierarchy comes from backgrounds, not shadows (mockup 00-01): Crème → Blanc → module tint.
 * Module tints (mockup 00-03): Learn Lime, Career Néon, Jobs Menthe claire, Hire Brume,
 * Connect Blanc, Intelligence AI gradient.
 */
export type CardTone =
  "default" | "learn" | "career" | "jobs" | "hire" | "connect" | "intelligence" | "dark";

const tones: Record<CardTone, string> = {
  default: "bg-blanc text-sapin",
  learn: "bg-lime text-sapin",
  career: "bg-neon text-sapin",
  jobs: "bg-menthe-claire text-sapin",
  hire: "bg-brume text-sapin",
  connect: "bg-blanc text-sapin",
  intelligence: "bg-gradient-ai text-blanc",
  dark: "bg-gradient-depth text-blanc",
};

type Props = ComponentProps<"div"> & {
  tone?: CardTone;
  /** Selected element: 2 px Sapin border (mockup 00-01). */
  selected?: boolean;
};

/** Application card: radius 24, padding 22 (`.card` of the mockups). */
export function Card({ tone = "default", selected = false, className, ...rest }: Props) {
  return (
    <div
      className={cx(
        "rounded-box p-[22px]",
        selected && "ring-2 ring-sapin",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return <h3 className={cx("text-h3", className)} {...rest} />;
}

export function CardText({ className, ...rest }: ComponentProps<"p">) {
  return <p className={cx("mt-1 text-sm leading-5", className)} {...rest} />;
}
