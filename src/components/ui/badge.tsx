import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type BadgeTone = "neutral" | "sapin" | "lime" | "success" | "warning" | "error" | "ai";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-brume text-sapin",
  sapin: "bg-sapin text-blanc",
  lime: "bg-lime text-sapin",
  success: "bg-feuille/12 text-[#2b7a3a]",
  warning: "bg-ambre/18 text-[#8a5a00]",
  error: "bg-corail/12 text-[#b23a2b]",
  ai: "bg-menthe-claire text-sapin",
};

/** Small rounded tag: status, category, AI mention. */
export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-label",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
