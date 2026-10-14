import { Icon } from "@/components/brand/icon";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AiOrb } from "@/components/brand/ai-orb";

/**
 * Compatibility score on the AI gradient, with its « Pourquoi ? » explanation (mockup 00-03).
 * Rule: every displayed score comes with its explanation (CLAUDE.md § 3).
 */
export function ExplainedScore({
  title,
  score,
  explanation,
}: {
  title: string;
  score: number;
  explanation: ReactNode;
}) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-2 rounded-box bg-gradient-ai px-[22px] py-5 text-blanc">
      <div className="flex items-center gap-2.5 text-lab text-neon">
        <AiOrb />
        {t("ai.brand")}
      </div>
      <p className="mt-1 text-sm leading-5 text-blanc/90">{title}</p>
      <p className="text-big">{t("ui.percent", { value: Math.round(score) })}</p>
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-neon underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
          <Icon name="eye" className="size-4" />
          {t("ai.card.why")}
        </summary>
        <div className="mt-2 text-xs leading-[18px] text-blanc/85">{explanation}</div>
      </details>
      <p className="text-[11px] leading-[15px] text-blanc/70">
        {t("common.aiRecommendsHumanDecides")}
      </p>
    </div>
  );
}

/**
 * One criterion of a score explanation (mockup 00-03, « Pourquoi ce score ? »): label, band
 * in words and a bar in the dark AI green. Used inside a white card.
 */
export function ScoreCriterion({
  label,
  band,
  percent,
}: {
  label: string;
  band: string;
  percent: number;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-3 text-xs leading-[17px]">
        <span>{label}</span>
        <span className="font-semibold">{band}</span>
      </div>
      <div aria-hidden className="h-[7px] overflow-hidden rounded-pill bg-brume">
        <div className="h-full rounded-pill bg-ia" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
