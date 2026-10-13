import { Icon } from "@/components/brand/icon";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AiOrb } from "@/components/brand/ai-orb";

/**
 * Compatibility score on the AI gradient, with its "Why?" explanation (§ 11.6).
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
    <div className="rounded-card bg-gradient-ai p-5 text-blanc">
      <div className="flex items-center gap-2 text-neon text-label">
        <AiOrb />
        {t("ai.brand")}
      </div>
      <p className="mt-3 text-[15px] leading-6">{title}</p>
      <p className="text-h1">{t("ui.percent", { value: Math.round(score) })}</p>
      <details className="group mt-2">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-lime underline-offset-4 hover:underline">
          <Icon name="transparence" className="size-4" />
          {t("ai.card.why")}
        </summary>
        <div className="mt-2 text-sm leading-6">{explanation}</div>
      </details>
      <p className="mt-3 text-caption">{t("common.aiRecommendsHumanDecides")}</p>
    </div>
  );
}
