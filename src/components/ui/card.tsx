import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/**
 * Hierarchy comes from backgrounds, not shadows (§ 11.3): Crème → Blanc → module tint.
 * Module tints (§ 11.1): Learn Lime, Career Néon, Jobs Menthe claire, Hire Brume,
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
  /** Selected element: 2 px Sapin border (§ 11.3). */
  selected?: boolean;
};

export function Card({ tone = "default", selected = false, className, ...rest }: Props) {
  return (
    <div
      className={cx(
        "rounded-card border-2 p-6",
        selected ? "border-sapin" : "border-transparent",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return <h3 className={cx("text-lg leading-7 font-semibold", className)} {...rest} />;
}

export function CardText({ className, ...rest }: ComponentProps<"p">) {
  return <p className={cx("mt-1 text-[15px] leading-6", className)} {...rest} />;
}
