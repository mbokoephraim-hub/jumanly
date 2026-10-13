import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

/** AI orb (brand guidelines § 10): marks a suggestion or analysis produced by AI. */
export function AiOrb({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-block size-3 shrink-0 rounded-full bg-ai-orb shadow-[0_0_10px_rgb(166_242_107/0.7)]",
        className,
      )}
    />
  );
}

/**
 * Compatibility score with its "Why?" explanation.
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
    <div className="rounded-md bg-gradient-ai p-5 text-blanc">
      <div className="flex items-center gap-2 text-neon text-label">
        <AiOrb />
        {t("ai.brand")}
      </div>
      <p className="mt-3 text-[15px] leading-6 opacity-90">{title}</p>
      <p className="text-h1">{t("ui.percent", { value: Math.round(score) })}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-medium text-lime underline-offset-4 hover:underline">
          {t("ai.card.why")}
        </summary>
        <div className="mt-2 text-sm leading-6 opacity-90">{explanation}</div>
      </details>
      <p className="mt-3 opacity-80 text-caption">{t("common.aiRecommendsHumanDecides")}</p>
    </div>
  );
}
