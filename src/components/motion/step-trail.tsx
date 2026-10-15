import { cx } from "@/lib/cx";

const W = 600;
const H = 64;
const X0 = 24;

/**
 * The trajectory of the diagnostic (docs/experience-animee § 5.2, shape « trajectoire »): one
 * point per dimension along a curve; past steps are lit in Lime, the current one pulses and the
 * cursor glides to it. Screen readers get the same steps as a list with their state.
 */
export function StepTrail({
  steps,
  current,
  label,
  doneLabel,
  currentLabel,
}: {
  steps: { key: string; label: string }[];
  current: number;
  label: string;
  doneLabel: string;
  currentLabel: string;
}) {
  const gap = (W - 2 * X0) / Math.max(1, steps.length - 1);
  const points = steps.map((_, index) => ({
    x: X0 + index * gap,
    y: H / 2 + (index % 2 === 0 ? 12 : -12),
  }));
  const d = points
    .map((point, index) => {
      if (index === 0) return `M${point.x},${point.y}`;
      const before = points[index - 1]!;
      const half = (point.x - before.x) / 2;
      return `C${before.x + half},${before.y} ${point.x - half},${point.y} ${point.x},${point.y}`;
    })
    .join(" ");
  const at = Math.max(0, Math.min(steps.length - 1, current));
  const fraction = steps.length > 1 ? at / (steps.length - 1) : 1;
  const cursor = points[at] ?? { x: X0, y: H / 2 };
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden className="h-auto w-full overflow-visible">
        <path d={d} fill="none" stroke="var(--color-brume)" strokeWidth={3} strokeLinecap="round" />
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke="var(--color-lime)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="1 1"
          strokeDashoffset={1 - fraction}
          className="jm-trail-progress"
        />
        {points.map((point, index) => (
          <circle
            key={steps[index]!.key}
            cx={point.x}
            cy={point.y}
            r={index === at ? 9 : 7}
            className={cx(
              index < at && "fill-lime",
              index === at && "jm-trail-now fill-sapin",
              index > at && "fill-blanc stroke-brume",
            )}
            strokeWidth={index > at ? 2 : 0}
          />
        ))}
        <g
          className="jm-trail-cursor"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <circle r={4} className="fill-lime" />
        </g>
      </svg>
      <ol aria-label={label} className="sr-only">
        {steps.map((step, index) => (
          <li key={step.key} aria-current={index === at ? "step" : undefined}>
            {step.label}
            {index < at ? ` (${doneLabel})` : index === at ? ` (${currentLabel})` : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
