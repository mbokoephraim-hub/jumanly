import { Icon } from "@/components/brand/icon";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export type BadgeTone =
  | "neutral"
  | "sapin"
  | "lime"
  | "new"
  | "white"
  | "outline"
  | "success"
  | "warning"
  | "error"
  | "ai"
  | "learn"
  | "career"
  | "jobs"
  | "hire"
  | "connect";

// Mockup 00-02 (`.tag`): 24 px pills, 600 11 px. Text colors keep an AA contrast on their fill.
const tones: Record<BadgeTone, string> = {
  neutral: "bg-brume text-sapin",
  sapin: "bg-sapin text-neon",
  lime: "bg-lime text-sapin",
  new: "bg-neon text-sapin",
  white: "bg-blanc text-sapin",
  outline: "bg-transparent text-feuille-fonce ring-[1.2px] ring-current ring-inset",
  success: "bg-lime-clair text-up-texte",
  warning: "bg-ambre-fond text-ambre-texte",
  error: "bg-down-fond text-down-texte",
  ai: "bg-menthe-claire text-menthe-texte",
  learn: "bg-lime text-sapin",
  career: "bg-neon text-sapin",
  jobs: "bg-menthe-claire text-menthe-texte",
  hire: "bg-brume text-sapin",
  connect: "bg-blanc text-sapin ring-1 ring-brume ring-inset",
};

const badgeBase =
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-pill px-2.5 text-[11px] leading-none font-semibold whitespace-nowrap [&_svg]:size-3.5";

/** Small pill tag: status, category, module, contract. */
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
    <span className={cx(badgeBase, tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** "Verified company" badge: outlined in Feuille. */
export function VerifiedBadge() {
  const t = useTranslations("common");
  return (
    <Badge tone="outline" icon={<Icon name="check" />}>
      {t("verifiedCompany")}
    </Badge>
  );
}

/** Trend + / −: Lime clair when up, pale Corail when down (never for a candidate score). */
export function TrendBadge({ value, label }: { value: number; label: string }) {
  const up = value >= 0;
  return (
    <Badge tone={up ? "success" : "error"}>
      {label}
      <Icon name={up ? "up" : "down"} />
    </Badge>
  );
}

export type MatchBand = "veryHigh" | "high" | "partial" | "low";

/**
 * Compatibility score with its band (part 08), on the AI gradient (mockup 00-03).
 * A candidate score is never shown in Corail.
 */
export function ScoreBadge({
  score,
  band,
  compact = false,
}: {
  score: number;
  band: MatchBand;
  /** Score only (tables, pipeline cards); the band is kept for screen readers. */
  compact?: boolean;
}) {
  const t = useTranslations();
  return (
    <span className={cx(badgeBase, "bg-gradient-ai text-blanc", !compact && "h-7 px-3 text-xs")}>
      {!compact && <Icon name="intelligence" />}
      <span>{t("ui.percent", { value: Math.round(score) })}</span>
      {compact ? (
        <span className="sr-only">{t(`match.band.${band}.text`)}</span>
      ) : (
        <>
          <span aria-hidden>{"·"}</span>
          {t(`match.band.${band}.text`)}
        </>
      )}
    </span>
  );
}
