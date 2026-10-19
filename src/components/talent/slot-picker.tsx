"use client";

import { useState } from "react";
import { TalentIcon } from "./icon";

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
 * « Autre date » (planche talent-2 § 3): a day, then an hour, up to three times. Each chosen
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
    <div className="t-flux">
      {picked.map((slot) => (
        <input key={slot} type="hidden" name="slot" value={slot} />
      ))}
      <fieldset className="t-fs">
        <legend className="sr-only">{labels.days}</legend>
        <div className="t-jours">
          {days.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={item.value === day}
              aria-label={item.long}
              onClick={() => setDay(item.value)}
              className="t-press"
            >
              <small>{item.weekday}</small>
              <b>{item.day}</b>
            </button>
          ))}
        </div>
      </fieldset>

      {current && (
        <fieldset className="t-fs">
          <legend className="t-lab-c">{current.long}</legend>
          <span className="sr-only">{labels.hours}</span>
          <div className="t-heures">
            {hours.map((hour) => {
              const slot = `${current.value}T${hour.value}`;
              const on = picked.includes(slot);
              return (
                <button
                  key={hour.value}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && picked.length >= max}
                  onClick={() => toggle(slot)}
                  className="t-press"
                >
                  {hour.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="t-flux t-serre" aria-live="polite">
        <p className="t-lab-c">
          {labels.chosen.replace("{count}", String(picked.length)).replace("{max}", String(max))}
        </p>
        {picked.length >= max && <p className="t-vide-t">{labels.full}</p>}
        <ul className="t-puces">
          {picked.map((slot) => (
            <li key={slot}>
              <button
                type="button"
                onClick={() => toggle(slot)}
                aria-label={labels.remove.replace("{slot}", label(slot))}
                className="t-puce t-on t-press"
              >
                {label(slot)}
                <TalentIcon name="fermer" size="xs" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
