import { Icon } from "@/components/brand/icon";
import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export type BadgeTone =
  | "neutral"
  | "sapin"
  | "lime"
  | "new"
  | "success"
  | "warning"
  | "error"
  | "ai"
  | "learn"
  | "career"
  | "jobs"
  | "hire"
  | "connect";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-brume text-sapin",
  sapin: "bg-sapin text-blanc",
  lime: "bg-lime text-sapin",
  new: "bg-neon text-sapin",
  success: "bg-feuille/15 text-feuille-fonce",
  warning: "bg-ambre/25 text-ambre-fonce",
  error: "bg-corail/15 text-corail-fonce",
  ai: "bg-menthe-claire text-sapin",
  learn: "bg-lime text-sapin",
  career: "bg-neon text-sapin",
  jobs: "bg-menthe-claire text-sapin",
  hire: "bg-brume text-sapin",
  connect: "bg-blanc text-sapin ring-1 ring-brume",
};

/** Small rounded tag: status, category, module, contract. */
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
        "inline-flex h-7 items-center gap-1.5 rounded-pill px-3 whitespace-nowrap text-label",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** "Verified company" badge. */
export function VerifiedBadge() {
  const t = useTranslations("common");
  return (
    <Badge tone="sapin" icon={<Icon name="valider" className="size-4 text-lime" />}>
      {t("verifiedCompany")}
    </Badge>
  );
}

/** Trend + / −: Feuille when up, Corail when down (never for a candidate score). */
export function TrendBadge({ value, label }: { value: number; label: string }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Badge tone={up ? "success" : "error"} icon={<Icon aria-hidden className="size-4" />}>
      {label}
    </Badge>
  );
}

export type MatchBand = "veryHigh" | "high" | "partial" | "low";

const bandTones: Record<MatchBand, string> = {
  veryHigh: "bg-lime text-sapin",
  high: "bg-menthe-claire text-sapin",
  partial: "bg-neon text-sapin",
  low: "bg-brume text-sapin",
};

/** Compatibility score with its band (part 08). A candidate score is never shown in Corail. */
export function ScoreBadge({ score, band }: { score: number; band: MatchBand }) {
  const t = useTranslations();
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-pill px-3 whitespace-nowrap text-label",
        bandTones[band],
      )}
    >
      <span className="font-semibold">{t("ui.percent", { value: Math.round(score) })}</span>
      <span aria-hidden>{"·"}</span>
      {t(`match.band.${band}.text`)}
    </span>
  );
}
