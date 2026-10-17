import { cx } from "@/lib/cx";

/**
 * A country's flag (V8 `.drap`, 30 × 20, or `.drap.s`, 21 × 14), from the flag-icons set served
 * in `public/drapeaux/` (MIT). Decorative: the country's name is always written next to it.
 */
export function Flag({
  code,
  small,
  className,
}: {
  code: string;
  small?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG, no optimisation needed.
    <img
      src={`/drapeaux/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      width={small ? 21 : 30}
      height={small ? 14 : 20}
      className={cx(
        "shrink-0 object-cover shadow-[0_0_0_1px_rgb(15_63_55/0.12)]",
        small ? "h-3.5 w-[21px] rounded-[3px]" : "h-5 w-[30px] rounded-[4px]",
        className,
      )}
    />
  );
}
