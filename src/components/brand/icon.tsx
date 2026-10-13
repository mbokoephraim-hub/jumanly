import type { SVGProps } from "react";
import { iconPaths } from "./icon-paths";

export type IconName = keyof typeof iconPaths;

/**
 * Jumanly icon (ressources/icones). Line drawn with `currentColor`: Sapin on light backgrounds,
 * white on dark ones, through the text color. `duo` adds the Lime disc of the duo style.
 * Decorative by default; pass `label` when the icon alone carries meaning.
 */
export function Icon({
  name,
  duo = false,
  label,
  className = "size-5",
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "name"> & { name: IconName; duo?: boolean; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {duo && <circle cx="15.5" cy="8.5" r="6" fill="var(--jm-lime)" />}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        // Paths generated from the brand's own SVG files (scripts/build-brand-assets.ts).
        dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
      />
    </svg>
  );
}
