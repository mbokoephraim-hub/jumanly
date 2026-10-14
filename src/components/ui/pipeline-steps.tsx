import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export const pipelineStages = ["new", "screening", "test", "interview", "offer", "hired"] as const;
export type PipelineStage = (typeof pipelineStages)[number];

/**
 * Pipeline steps: each recruitment stage with its candidate count, as pills (mockup 00-03).
 * There is never an « automatically rejected » stage. The current stage is marked with aria-current.
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
              "flex h-10 shrink-0 items-center gap-2 rounded-pill pr-1.5 pl-4 text-[13px] font-semibold",
              active ? "bg-sapin text-blanc" : "bg-gris-clair text-sapin",
            )}
          >
            {t(stage)}
            <span
              className={cx(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-pill px-2 text-[11px] font-semibold",
                active ? "bg-lime text-sapin" : "bg-blanc text-sapin",
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
