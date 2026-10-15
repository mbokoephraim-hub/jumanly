import { cx } from "@/lib/cx";

export type TrackStage = { key: string; label: string; range: string; from: number; to: number };

/**
 * The four stages of the diagnostic drawn as a trajectory (docs/experience-animee § 5.5): each
 * stage is a segment as wide as its range, the stages behind the talent are lit, and the marker
 * glides to the score. The marker's place is final from the start; only its glide is animated.
 */
export function StageTrack({
  stages,
  score,
  current,
  label,
  hereLabel,
}: {
  stages: TrackStage[];
  score: number;
  current: string;
  label: string;
  hereLabel: string;
}) {
  const at = Math.max(1.5, Math.min(98.5, score));
  const reached = stages.findIndex((stage) => stage.key === current);
  return (
    <div className="flex flex-col gap-2">
      <div className="relative pt-9">
        <div
          aria-hidden
          className="jm-marker absolute inset-x-0 top-0"
          style={{ transform: `translateX(${at}%)` }}
        >
          <span className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1">
            <span className="rounded-pill bg-sapin px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-neon">
              {hereLabel}
            </span>
            <span className="size-3 rounded-full bg-sapin ring-4 ring-lime" />
          </span>
        </div>
        <div aria-hidden className="flex h-2.5 gap-1">
          {stages.map((stage, index) => (
            <span
              key={stage.key}
              style={{
                flex: `${stage.to - stage.from + (index === stages.length - 1 ? 0 : 1)} 1 0`,
              }}
              className={cx(
                "h-full rounded-pill",
                index < reached ? "bg-lime" : index === reached ? "bg-feuille" : "bg-gris-clair",
              )}
            />
          ))}
        </div>
      </div>
      <ol aria-label={label} className="flex gap-1">
        {stages.map((stage, index) => (
          <li
            key={stage.key}
            aria-current={index === reached ? "step" : undefined}
            style={{ flex: `${stage.to - stage.from + (index === stages.length - 1 ? 0 : 1)} 1 0` }}
            className="flex min-w-0 flex-col"
          >
            <span
              className={cx(
                "truncate text-xs",
                index === reached ? "font-semibold text-sapin" : "text-ardoise",
              )}
            >
              {stage.label}
            </span>
            <span className="truncate text-[11px] text-ardoise max-sm:hidden">{stage.range}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
