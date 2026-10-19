import { cx } from "@/lib/cx";

export type OrbiState = "repos" | "ecoute" | "reflechit";

/**
 * The mark of Orbi (planche Fondations § 9): a Sapin disc, its orbit and a Lime satellite, no dark
 * gradient. « ecoute »: the orbit breathes; « reflechit »: the satellite turns. Both stop in reduced
 * motion (src/styles/talent.css).
 */
export function OrbiMark({
  size = 48,
  state = "repos",
  className,
}: {
  size?: number;
  state?: OrbiState;
  className?: string;
}) {
  return (
    <svg
      className={cx("t-orbi-m", `t-${state}`, className)}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      focusable="false"
    >
      <circle cx="24" cy="24" r="23" fill="#0F3F37" />
      <circle
        className="t-orb"
        cx="24"
        cy="24"
        r="13"
        fill="none"
        stroke="#A6F26B"
        strokeOpacity=".45"
        strokeWidth="1.6"
      />
      <circle cx="24" cy="24" r="5" fill="#F2EDE5" />
      <g className="t-sat">
        <circle cx="33.2" cy="14.8" r="4.4" fill="#A6F26B" />
      </g>
    </svg>
  );
}
