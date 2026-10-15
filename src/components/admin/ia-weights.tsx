"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

export type WeightRow = { key: string; label: string; desc: string; value: number };

/**
 * Rows of « Poids par défaut du matching » (mockup 07-09): a slider and a number field per
 * criterion, and the live « Total : n/100 » tag. The number fields are the form fields; the
 * sliders only move them. While the total is not 100 the form cannot be sent (the server checks
 * it again). Without JavaScript the number fields work alone.
 */
export function WeightsEditor({
  rows,
  disabled,
  labels,
  header,
}: {
  rows: WeightRow[];
  disabled: boolean;
  labels: { criterion: string; value: string; total: string; error: string };
  /** Title block of the card, rendered on the server. */
  header: ReactNode;
}) {
  const [values, setValues] = useState(() => Object.fromEntries(rows.map((r) => [r.key, r.value])));
  const first = useRef<HTMLInputElement>(null);
  const total = Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const ok = total === 100;

  useEffect(() => {
    first.current?.setCustomValidity(ok ? "" : labels.error);
  }, [ok, labels.error]);

  // « Annuler » resets the form: put the sliders back too.
  useEffect(() => {
    const form = first.current?.form;
    if (!form) return;
    const reset = () => setValues(Object.fromEntries(rows.map((r) => [r.key, r.value])));
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [rows]);

  const set = (key: string, raw: string) => {
    const value = Math.max(0, Math.min(100, Math.round(Number(raw) || 0)));
    setValues((current) => ({ ...current, [key]: raw === "" ? 0 : value }));
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {header}
        <span
          role="status"
          className={cx(
            "inline-flex h-[30px] shrink-0 items-center gap-1.5 self-start rounded-pill px-3 text-[12px] font-semibold",
            ok ? "bg-lime-clair text-up-texte" : "bg-down-fond text-down-texte",
          )}
        >
          <Icon name={ok ? "check" : "alerte"} className="size-3.5" />
          {labels.total.replace("{total}", String(total))}
        </span>
      </div>
      {!ok && <p className="text-[12px] font-medium text-down-texte">{labels.error}</p>}
      <div className="flex items-center py-1 text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase">
        <span className="flex-1">{labels.criterion}</span>
        <span>{labels.value}</span>
      </div>
      <fieldset disabled={disabled} className="flex flex-col">
        <legend className="sr-only">{labels.criterion}</legend>
        {rows.map((row, index) => {
          const value = values[row.key] ?? 0;
          return (
            <div
              key={row.key}
              className={cx(
                "flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:gap-4",
                index > 0 && "border-t border-brume",
              )}
            >
              <div className="flex min-w-0 flex-col lg:max-w-[340px] lg:flex-1">
                <label htmlFor={`ia-weight-${row.key}`} className="text-[13.5px] font-semibold">
                  {row.label}
                </label>
                <span
                  id={`ia-weight-${row.key}-desc`}
                  className="text-[11px] leading-[15px] text-ardoise"
                >
                  {row.desc}
                </span>
              </div>
              <div className="flex items-center gap-3 lg:flex-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  onChange={(event) => set(row.key, event.target.value)}
                  aria-hidden
                  tabIndex={-1}
                  className={cx(
                    "h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-pill bg-brume bg-no-repeat disabled:cursor-default",
                    "[&::-webkit-slider-thumb]:size-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blanc [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#0F3F37]",
                    "[&::-moz-range-thumb]:size-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blanc [&::-moz-range-thumb]:shadow-[0_0_0_2px_#0F3F37]",
                  )}
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #0F3F37 0%, #14745F 55%, #2FD3A6 100%)",
                    backgroundSize: `${value}% 100%`,
                  }}
                />
                <input
                  ref={index === 0 ? first : undefined}
                  id={`ia-weight-${row.key}`}
                  name={row.key}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  required
                  value={value}
                  onChange={(event) => set(row.key, event.target.value)}
                  aria-describedby={`ia-weight-${row.key}-desc`}
                  className="h-[34px] w-[62px] shrink-0 [appearance:textfield] rounded-[10px] bg-blanc text-center text-[14px] font-semibold text-sapin ring-[1.5px] ring-brume ring-inset focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:ring-2 focus:ring-sapin focus:outline-none disabled:opacity-70 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
          );
        })}
      </fieldset>
    </>
  );
}
