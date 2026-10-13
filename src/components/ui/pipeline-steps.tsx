import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export const pipelineStages = ["new", "screening", "test", "interview", "offer", "hired"] as const;
export type PipelineStage = (typeof pipelineStages)[number];

/**
 * Pipeline steps (§ 11.5): each recruitment stage with its candidate count.
 * The current stage is marked for screen readers with aria-current.
 */
export function PipelineSteps({
  counts,
  current,
}: {
  counts: Partial<Record<PipelineStage, number>>;
  current?: PipelineStage;
}) {
  const t = useTranslations("hire.pipeline.stage");
  return (
    <ol tabIndex={0} className="flex gap-2 overflow-x-auto pb-1">
      {pipelineStages.map((stage) => {
        const active = stage === current;
        return (
          <li
            key={stage}
            aria-current={active ? "step" : undefined}
            className={cx(
              "flex h-11 shrink-0 items-center gap-2 rounded-pill px-4 text-sm font-medium",
              active ? "bg-sapin text-blanc" : "bg-blanc text-sapin",
            )}
          >
            {t(stage)}
            <span
              className={cx(
                "inline-flex min-w-6 justify-center rounded-pill px-1.5 text-label",
                active ? "bg-lime text-sapin" : "bg-brume text-sapin",
              )}
            >
              {t("count", { count: counts[stage] ?? 0 })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
