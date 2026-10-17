"use client";

import { useState } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

export type PickerDay = {
  /** « 2026-10-27 », in the interview's time zone. */
  value: string;
  weekday: string;
  day: string;
  /** « Lundi 27 octobre ». */
  long: string;
  /** « lun. 27 oct. », for a chosen slot. */
  short: string;
};

/**
 * « Proposer un autre moment » (screen 21): a day, then an hour, up to three times. Each chosen
 * time travels as a `slot` field (« 2026-10-27T10:00 »), read in the interview's time zone.
 */
export function SlotPicker({
  days,
  hours,
  initial,
  max,
  labels,
}: {
  days: PickerDay[];
  hours: { value: string; label: string }[];
  initial: string[];
  max: number;
  labels: {
    days: string;
    hours: string;
    /** « Vos propositions · {count} sur {max} ». */
    chosen: string;
    /** « {day} · {hour} ». */
    item: string;
    remove: string;
    full: string;
  };
}) {
  const [day, setDay] = useState(days[0]?.value ?? "");
  const [picked, setPicked] = useState<string[]>(initial.slice(0, max));
  const current = days.find((item) => item.value === day);
  const hourLabel = (value: string) => hours.find((hour) => hour.value === value)?.label ?? value;
  const label = (slot: string) => {
    const [date, time] = slot.split("T");
    const short = days.find((item) => item.value === date)?.short ?? date ?? "";
    return labels.item.replace("{day}", short).replace("{hour}", hourLabel(time ?? ""));
  };
  const toggle = (slot: string) =>
    setPicked((list) =>
      list.includes(slot)
        ? list.filter((item) => item !== slot)
        : list.length >= max
          ? list
          : [...list, slot].sort(),
    );

  return (
    <div className="flex flex-col gap-4">
      {picked.map((slot) => (
        <input key={slot} type="hidden" name="slot" value={slot} />
      ))}
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{labels.days}</legend>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {days.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={item.value === day}
              aria-label={item.long}
              onClick={() => setDay(item.value)}
              className={cx(
                "flex h-[68px] w-14 shrink-0 flex-col items-center justify-center rounded-[16px] leading-tight",
                item.value === day ? "bg-sapin text-blanc" : "bg-blanc shadow-douce",
              )}
            >
              <span
                className={cx("text-[13px]", item.value === day ? "text-lime" : "text-ardoise")}
              >
                {item.weekday}
              </span>
              <span className="text-[20px] font-bold">{item.day}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {current && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[15px] font-semibold">{current.long}</legend>
          <span className="sr-only">{labels.hours}</span>
          <div className="grid grid-cols-3 gap-2.5">
            {hours.map((hour) => {
              const slot = `${current.value}T${hour.value}`;
              const on = picked.includes(slot);
              const disabled = !on && picked.length >= max;
              return (
                <button
                  key={hour.value}
                  type="button"
                  aria-pressed={on}
                  disabled={disabled}
                  onClick={() => toggle(slot)}
                  className={cx(
                    "h-12 rounded-[16px] text-[15px] font-semibold",
                    on ? "bg-lime ring-2 ring-sapin" : "bg-blanc shadow-douce",
                    disabled && "opacity-45",
                  )}
                >
                  {hour.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-2" aria-live="polite">
        <p className="text-[15px] font-semibold">
          {labels.chosen.replace("{count}", String(picked.length)).replace("{max}", String(max))}
        </p>
        {picked.length >= max && <p className="text-[13px] text-ardoise">{labels.full}</p>}
        <ul className="flex flex-wrap gap-2">
          {picked.map((slot) => (
            <li key={slot}>
              <button
                type="button"
                onClick={() => toggle(slot)}
                aria-label={labels.remove.replace("{slot}", label(slot))}
                className="flex h-10 items-center gap-2 rounded-pill bg-sapin px-4 text-[14px] font-semibold text-blanc"
              >
                {label(slot)}
                <Icon name="fermer" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
