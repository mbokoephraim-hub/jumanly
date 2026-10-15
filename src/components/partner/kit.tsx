import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { CountUp } from "@/components/motion/count-up";
import { cx } from "@/lib/cx";
import type { BatchStatus } from "@/server/services/partners";

/**
 * Shared pieces of the partner space (mockups 06-01 to 06-03): cards, figure tiles, the hatched
 * « Données masquées » block and the bars of active beneficiaries per month.
 */

export const partnerCard = "flex min-w-0 flex-col rounded-[24px] bg-blanc p-5 lg:p-6";
export const partnerTitle =
  "text-[20px] leading-[26px] font-semibold tracking-[-0.015em] lg:text-[22px] lg:leading-7";

/** Status tag of a batch: Sapin text on light tints only. */
export const batchTag: Record<BatchStatus, string> = {
  upcoming: "bg-neon/60",
  active: "bg-lime",
  exhausted: "bg-menthe-claire",
  expired: "bg-gris-clair",
};

/** Hatching of the masked cells (fewer people than the anonymity threshold). */
export const hatch: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgb(220 229 225 / 0.55) 0 10px, transparent 10px 20px)",
};

/** Hatched line « Données masquées : moins de 10 bénéficiaires concernés. » */
export function MaskedNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        "flex items-center gap-3 rounded-[16px] bg-creme px-4 py-3 text-[12.5px] leading-[17px] text-ardoise",
        className,
      )}
      style={hatch}
    >
      <Icon name="eye" className="size-4 shrink-0 text-sapin" />
      <span>{children}</span>
    </p>
  );
}

/** Round icon tile on a pale disc. */
export function IconDisc({
  icon,
  tone = "bg-gris-clair",
  className,
}: {
  icon: IconName;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid size-[38px] shrink-0 place-items-center rounded-full text-sapin lg:size-[42px]",
        tone,
        className,
      )}
    >
      <Icon name={icon} className="size-[18px]" />
    </span>
  );
}

/** A figure that counts up when it is a plain integer, or its text (« 9,6 h », « Masqué »). */
export function Figure({ value, number }: { value: string; number?: number | null }) {
  return number !== undefined && number !== null && value === String(number) ? (
    <CountUp value={number} />
  ) : (
    <>{value}</>
  );
}

/** Rounds a chart maximum up to 1, 2 or 5 × 10ⁿ, so the grid reads well. */
export function niceMax(value: number) {
  if (value <= 10) return 10;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((factor) => factor * power >= value) ?? 10;
  return step * power;
}

/**
 * Bars of active beneficiaries per month (mockups 06-01 and 06-03). The last month is Sapin with
 * its value in a pill; a hidden month is a hatched stub. The bars grow once (transform only).
 */
export function MonthBars({
  months,
  label,
  className,
}: {
  /** `text`: the month and its value (or « Masqué »), read by screen readers. */
  months: { key: string; label: string; value: number | null; text: string }[];
  label: string;
  className?: string;
}) {
  const max = niceMax(Math.max(0, ...months.map((month) => month.value ?? 0)));
  const ticks = [max, max / 2, 0];
  const format = new Intl.NumberFormat("fr");
  return (
    <figure className={cx("flex flex-col gap-2", className)}>
      <figcaption className="sr-only">{label}</figcaption>
      <ul className="sr-only">
        {months.map((month) => (
          <li key={month.key}>{month.text}</li>
        ))}
      </ul>
      <div aria-hidden className="grid grid-cols-[34px_minmax(0,1fr)] gap-x-2">
        <div className="relative h-[150px] lg:h-[170px]">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[11px] text-ardoise"
              style={{ top: `${(index / 2) * 100}%` }}
            >
              {format.format(tick)}
            </span>
          ))}
        </div>
        <div className="relative h-[150px] lg:h-[170px]">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className="absolute inset-x-0 border-t border-dashed border-brume"
              style={{ top: `${(index / 2) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-2 px-1 sm:gap-3 lg:gap-4">
            {months.map((month, index) => {
              const last = index === months.length - 1;
              const ratio = month.value === null ? 0.08 : Math.max(0.03, month.value / max);
              return (
                <div key={month.key} className="relative flex h-full flex-1 items-end">
                  <span
                    className={cx(
                      "jm-grow block w-full rounded-t-[8px] rounded-b-[4px] lg:rounded-t-[10px]",
                      month.value === null ? "bg-gris-clair" : last ? "bg-sapin" : "bg-lime",
                    )}
                    style={{
                      height: `${ratio * 100}%`,
                      ...(month.value === null ? hatch : {}),
                    }}
                  />
                  {last && month.value !== null && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 rounded-pill bg-sapin px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-lime"
                      style={{ bottom: `calc(${ratio * 100}% + 8px)` }}
                    >
                      {format.format(month.value)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <span />
        <div className="flex gap-2 px-1 pt-2 sm:gap-3 lg:gap-4">
          {months.map((month) => (
            <span key={month.key} className="flex-1 text-center text-[11px] text-ardoise">
              {month.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
