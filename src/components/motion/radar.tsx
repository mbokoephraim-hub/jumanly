import { cx } from "@/lib/cx";

export type RadarAxis = { key: string; label: string; value: number };

const point = (index: number, count: number, radius: number, center: number) => {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
  return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)] as const;
};

const shape = (values: number[], radius: number, center: number) =>
  values
    .map((value, index) => {
      const [x, y] = point(
        index,
        values.length,
        (radius * Math.max(0, Math.min(100, value))) / 100,
        center,
      );
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

/**
 * Radar of the diagnostic (docs/experience-animee § 5.5): one axis per dimension, out of 100,
 * each label carrying its value in writing. The previous diagnostic, when given, is drawn dashed
 * behind. An image for screen readers (its title and description list the values); pages also
 * give the values in a table.
 */
export function Radar({
  id,
  axes,
  previous,
  title,
  description,
  size = 320,
  tone = "light",
  showValues = true,
  animate = false,
  className,
}: {
  /** Unique on the page (ids of the title and description). */
  id: string;
  axes: RadarAxis[];
  previous?: number[] | null;
  title: string;
  description: string;
  size?: number;
  tone?: "light" | "dark";
  showValues?: boolean;
  /** The shape grows from the centre once (result page). */
  animate?: boolean;
  className?: string;
}) {
  const pad = 104;
  const box = size + pad * 2;
  const center = box / 2;
  const radius = size / 2;
  const dark = tone === "dark";
  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className={cx("h-auto w-full", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{description}</desc>
      <g aria-hidden>
        {[25, 50, 75, 100].map((ring) => (
          <polygon
            key={ring}
            points={shape(
              axes.map(() => ring),
              radius,
              center,
            )}
            fill="none"
            stroke={dark ? "rgb(255 255 255 / 0.16)" : "var(--color-brume)"}
            strokeWidth={ring === 100 ? 1.5 : 1}
          />
        ))}
        {axes.map((axis, index) => {
          const [x, y] = point(index, axes.length, radius, center);
          return (
            <line
              key={axis.key}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={dark ? "rgb(255 255 255 / 0.16)" : "var(--color-brume)"}
            />
          );
        })}
        {previous && previous.length === axes.length && (
          <polygon
            points={shape(previous, radius, center)}
            fill="none"
            stroke={dark ? "rgb(255 255 255 / 0.7)" : "var(--color-ardoise)"}
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
        )}
        <g className={cx(animate && "jm-radar-shape")}>
          <polygon
            points={shape(
              axes.map((axis) => axis.value),
              radius,
              center,
            )}
            fill="rgb(166 242 107 / 0.45)"
            stroke={dark ? "var(--color-lime)" : "var(--color-sapin)"}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {axes.map((axis, index) => {
            const [x, y] = point(
              index,
              axes.length,
              (radius * Math.max(0, Math.min(100, axis.value))) / 100,
              center,
            );
            return (
              <circle
                key={axis.key}
                cx={x}
                cy={y}
                r={4}
                fill={dark ? "var(--color-lime)" : "var(--color-sapin)"}
              />
            );
          })}
        </g>
        {axes.map((axis, index) => {
          const [x, y] = point(index, axes.length, radius + 22, center);
          const anchor = Math.abs(x - center) < 4 ? "middle" : x > center ? "start" : "end";
          return (
            <text
              key={axis.key}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className={cx("text-[13px] font-semibold", dark ? "fill-blanc" : "fill-sapin")}
            >
              <tspan x={x} dy={showValues ? "-0.5em" : 0}>
                {axis.label}
              </tspan>
              {showValues && (
                <tspan
                  x={x}
                  dy="1.25em"
                  className={cx("font-normal", dark ? "fill-blanc/80" : "fill-ardoise")}
                >
                  {Math.round(axis.value)}
                </tspan>
              )}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
