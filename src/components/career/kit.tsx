import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/** Shared pieces of the Career pages (mockups 03-08 to 03-15). */

export const careerTabs = [
  { key: "home", href: "/app/career", icon: "career" },
  { key: "diagnostic", href: "/app/career/diagnostic", icon: "objectif" },
  { key: "cv", href: "/app/career/cv", icon: "doc" },
  { key: "documents", href: "/app/career/documents", icon: "doc" },
  { key: "linkedin", href: "/app/career/linkedin", icon: "partager" },
  { key: "interviews", href: "/app/career/entretiens", icon: "mic" },
  { key: "plan", href: "/app/career/plan", icon: "calendrier" },
  { key: "portfolio", href: "/app/career/portfolio", icon: "lien" },
] as const satisfies readonly { key: string; href: string; icon: IconName }[];

export type CareerTab = (typeof careerTabs)[number]["key"];

export const card = "rounded-[24px] bg-blanc p-5 lg:p-6";
export const cardTitle = "text-[20px] leading-tight font-semibold lg:text-[22px]";
export const eyebrow = "text-[11px] font-semibold tracking-[0.12em] uppercase";

export const pill = {
  base: "inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  md: "h-11 px-5 text-[15px]",
  sm: "h-9 px-4 text-[13px]",
  lime: "bg-lime text-sapin hover:bg-lime/85",
  dark: "bg-sapin text-blanc hover:bg-sapin/90",
  outline: "bg-blanc text-sapin ring-1 ring-brume ring-inset hover:bg-creme",
  ghost: "bg-blanc/10 text-blanc ring-1 ring-blanc/30 ring-inset hover:bg-blanc/20",
} as const;

export function pillClass(
  tone: "lime" | "dark" | "outline" | "ghost",
  size: "md" | "sm" = "md",
  className?: string,
) {
  return cx(pill.base, pill[size], pill[tone], className);
}

/** Green gradient panel of Jumanly Intelligence, with its two rings. */
export function AiPanel({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cx(
        "relative flex flex-col gap-3 overflow-hidden rounded-[24px] bg-[linear-gradient(45deg,#0F3F37_0%,#14745F_55%,#2FD3A6_100%)] p-5 text-blanc lg:p-6",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full ring-1 ring-blanc/20"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 size-28 rounded-full ring-1 ring-blanc/15"
      />
      <div className="relative flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** "Jumanly Intelligence" with the orb, at the top of an AI panel. */
export async function AiBrand({ label }: { label?: string }) {
  const t = await getTranslations("ai");
  return (
    <p className={cx(eyebrow, "flex items-center gap-2.5 text-neon")}>
      <AiOrb size={26} />
      {label ?? t("brand")}
    </p>
  );
}

/** "Pourquoi ?" line under an AI proposal. */
export async function Why({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  const t = await getTranslations("ai.card");
  return (
    <p className={cx("flex gap-2 text-xs leading-[17px]", dark ? "text-blanc/85" : "text-ardoise")}>
      <Icon
        name="eye"
        className={cx("mt-px size-4 shrink-0", dark ? "text-neon" : "text-feuille")}
      />
      <span>
        <strong className={dark ? "text-blanc" : "text-sapin"}>{t("why")}</strong> {children}
      </span>
    </p>
  );
}

/** Rounded icon tile of the Career cards. */
export function IconTile({
  icon,
  tone = "bg-lime",
  size = "md",
}: {
  icon: IconName;
  tone?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center justify-center text-sapin",
        size === "md" ? "size-12 rounded-[14px]" : "size-10 rounded-xl",
        tone,
      )}
    >
      <Icon name={icon} className={size === "md" ? "size-5" : "size-[18px]"} />
    </span>
  );
}

/** Score ring (CV score, interview feedback, plan steps). */
export function ScoreRing({
  value,
  max = 100,
  label,
  size = 84,
  dark = false,
}: {
  value: number;
  max?: number;
  label: string;
  size?: number;
  dark?: boolean;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className={dark ? "stroke-blanc/15" : "stroke-lime-clair"}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-lime"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <span
        className={cx("absolute font-bold", dark ? "text-blanc" : "text-sapin")}
        style={{ fontSize: Math.round(size * 0.29) }}
      >
        {label}
      </span>
    </span>
  );
}
