import { cx } from "@/lib/cx";

export type OrbiState = "repos" | "ecoute" | "reflechit";

/**
 * The mark of Orbi, drawn like the real Orbi icon (OrbiDisc, src/components/phone/icon.tsx): a mint
 * disc, the dark spark and a Crème dot. « ecoute »: the orbit breathes; « reflechit »: the satellite turns. Both stop in reduced
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
      <circle cx="24" cy="24" r="23" fill="#2FD3A6" />
      <circle
        className="t-orb"
        cx="24"
        cy="24"
        r="17"
        fill="none"
        stroke="#0B1A1F"
        strokeOpacity="0"
        strokeWidth="1.4"
      />
      <path
        d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z"
        fill="#0B1A1F"
      />
      <g className="t-sat">
        <circle cx="35" cy="13" r="3.4" fill="#F2EDE5" />
      </g>
    </svg>
  );
}
