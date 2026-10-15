import { cx } from "@/lib/cx";

/** A bar out of 100 that fills once (« Arrivée » curve). The width is final from the start. */
export function Gauge({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <span
      aria-hidden
      className={cx("block h-2 overflow-hidden rounded-pill bg-gris-clair", className)}
    >
      <span
        className={cx(
          "jm-gauge block h-full origin-left rounded-pill",
          clamped >= 70 ? "bg-feuille" : clamped >= 40 ? "bg-lime" : "bg-menthe",
        )}
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </span>
  );
}
