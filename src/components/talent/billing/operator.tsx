import { cx } from "@/lib/cx";

/** Colours of the Mobile Money services (planche talent-4 § 7, `.lf`), by provider code. */
const tones: Record<string, string> = {
  mpesa: "t-op-mpesa",
  orange: "t-op-orange",
  airtel: "t-op-airtel",
  mtn: "t-op-mtn",
};

/** The square with the initial of a Mobile Money service. Decorative: its name is written next. */
export function OperatorTile({
  code,
  name,
  className,
}: {
  code: string;
  name: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={cx("t-lf", tones[code] ?? "t-op-autre", className)}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
