import { HIRE_ICON_PATHS, HIRE_SYMBOL, type HireIconName } from "./icon-paths";

/**
 * An icon of the recruiter's web app v3: the line drawings of the prototype (`I()` of
 * docs/mvp-web-recruteur/prototype-v3/code/hire-v3.js), unchanged. `size` gives the prototype's
 * small (`s`) or large (`l`) variant.
 */
export function HireIcon({
  name,
  size,
  className,
  style,
}: {
  name: HireIconName;
  size?: "s" | "l";
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={["ico", size, className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={style}
      // The drawings are fixed strings of the prototype, never a person's text.
      dangerouslySetInnerHTML={{ __html: HIRE_ICON_PATHS[name] }}
    />
  );
}

/** The J of the logo, in Sapin on the Lime tile (`SYML` of the prototype, both strokes Sapin). */
export function HireSymbol() {
  const svg = HIRE_SYMBOL.replace('stroke="#fff"', 'stroke="#0F3F37"').replace(
    'fill="#A6F26B"',
    'fill="#0F3F37"',
  );
  return <span className="lgt" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export type { HireIconName };
