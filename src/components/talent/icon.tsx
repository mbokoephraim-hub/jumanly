import { cx } from "@/lib/cx";
import { talentIconPaths } from "./icon-paths";

export type TalentIconName = keyof typeof talentIconPaths;

/**
 * Icon of the talent space (docs/refonte-mobile, planche Fondations § 2): 24 px grid, 1.8 px line,
 * round ends, drawn with `currentColor`. `on` is the active state: thicker line and the Lime dot
 * of the logo. Decorative unless `label` is given.
 */
export function TalentIcon({
  name,
  on = false,
  size,
  label,
  className,
}: {
  name: TalentIconName;
  on?: boolean;
  /** s = 20 px, xs = 16 px, l = 28 px; 24 px otherwise. */
  size?: "s" | "xs" | "l";
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("t-ic", size && `t-${size}`, on && "t-on", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={on ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {/* Paths generated from ressources/icones/talent (scripts/build-brand-assets.ts). */}
      <g dangerouslySetInnerHTML={{ __html: talentIconPaths[name] }} />
      {on && <circle className="t-pt" cx="19.6" cy="4.4" r="3.1" />}
    </svg>
  );
}
