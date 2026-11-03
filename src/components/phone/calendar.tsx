"use client";

import "@/styles/phone-calendrier.css";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { PhoneIcon } from "./icon";
import { PhoneSheet } from "./sheet";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));
const parse = (value: string | null | undefined) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
const todayIso = () => {
  const now = new Date();
  return iso(utc(now.getFullYear(), now.getMonth(), now.getDate()));
};

/**
 * The calendar of the app (Ephraïm, 03/11/2026, his model in Jumanly's colours): a coloured band
 * with the title and the month arrows, a dark card inside with the month and the year to choose,
 * the days in a grid of thin cells (the days of the months around in grey), the chosen day as a
 * Lime square. Used by every date of the talent and recruiter spaces on the phone.
 */
export function JmCalendar({
  title,
  value,
  onChange,
  min,
  max,
  footer,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  /** First and last day that can be chosen (yyyy-mm-dd). */
  min?: string;
  max?: string;
  footer?: ReactNode;
}) {
  const t = useTranslations("phone.calendar");
  const format = useFormatter();
  const minDate = parse(min);
  const maxDate = parse(max);
  const start = parse(value) ?? parse(min) ?? parse(todayIso())!;
  const [month, setMonth] = useState(() => utc(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const today = todayIso();

  const weekdays = useMemo(
    () =>
      // 1 January 2024 was a Monday: the week starts on Monday.
      Array.from({ length: 7 }, (_, index) =>
        format
          .dateTime(utc(2024, 0, 1 + index), { weekday: "short", timeZone: "UTC" })
          .replace(".", "")
          .slice(0, 2)
          .toUpperCase(),
      ),
    [format],
  );
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const text = format.dateTime(utc(2024, index, 1), { month: "short", timeZone: "UTC" });
        return text.charAt(0).toUpperCase() + text.slice(1);
      }),
    [format],
  );
  const year = month.getUTCFullYear();
  const firstYear = minDate ? minDate.getUTCFullYear() : year - 80;
  const lastYear = maxDate ? maxDate.getUTCFullYear() : year + 10;
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);

  // Six full weeks, the days of the months before and after included (shown in grey).
  const cells = useMemo(() => {
    const offset = (month.getUTCDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) =>
      utc(month.getUTCFullYear(), month.getUTCMonth(), 1 - offset + index),
    );
  }, [month]);
  const rows = cells[35]!.getUTCMonth() !== month.getUTCMonth() ? cells.slice(0, 35) : cells;

  const outOfRange = (date: Date) =>
    (minDate !== null && date < minDate) || (maxDate !== null && date > maxDate);
  const go = (next: Date) => setMonth(utc(next.getUTCFullYear(), next.getUTCMonth(), 1));
  const canBack = !minDate || utc(year, month.getUTCMonth(), 0) >= minDate;
  const canNext = !maxDate || utc(year, month.getUTCMonth() + 1, 1) <= maxDate;

  return (
    <div className="nb-cal">
      <div className="nb-cal-bande">
        <b>{title}</b>
        <span>
          <button
            type="button"
            aria-label={t("prev")}
            disabled={!canBack}
            onClick={() => go(utc(year, month.getUTCMonth() - 1, 1))}
          >
            <PhoneIcon name="retour" size={18} stroke={2.4} />
          </button>
          <button
            type="button"
            aria-label={t("next")}
            disabled={!canNext}
            onClick={() => go(utc(year, month.getUTCMonth() + 1, 1))}
          >
            <PhoneIcon name="chevron" size={18} stroke={2.4} />
          </button>
        </span>
      </div>
      <div className="nb-cal-carte">
        <div className="nb-cal-choix">
          <label className="nb-cal-pilule">
            <span className="sr-only">{t("month")}</span>
            <select
              value={month.getUTCMonth()}
              onChange={(event) => go(utc(year, Number(event.target.value), 1))}
            >
              {months.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
            <PhoneIcon name="bas" size={14} stroke={2.4} />
          </label>
          <label className="nb-cal-pilule">
            <span className="sr-only">{t("year")}</span>
            <select
              value={year}
              onChange={(event) => go(utc(Number(event.target.value), month.getUTCMonth(), 1))}
            >
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <PhoneIcon name="bas" size={14} stroke={2.4} />
          </label>
        </div>
        <div className="nb-cal-sem" aria-hidden>
          {weekdays.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
        <div
          className="nb-cal-grille"
          role="grid"
          aria-label={`${months[month.getUTCMonth()]} ${year}`}
        >
          {rows.map((date) => {
            const key = iso(date);
            const other = date.getUTCMonth() !== month.getUTCMonth();
            return (
              <button
                key={key}
                type="button"
                className="nb-cal-jour"
                data-autre={other ? "" : undefined}
                data-auj={key === today ? "" : undefined}
                aria-pressed={key === value}
                aria-label={format.dateTime(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
                disabled={outOfRange(date)}
                onClick={() => {
                  onChange(key);
                  if (other) go(date);
                }}
              >
                {date.getUTCDate()}
              </button>
            );
          })}
        </div>
        {footer}
      </div>
    </div>
  );
}

/**
 * A date field of a form: a button showing the chosen date, the calendar in a sheet, « Confirmer »
 * or « Annuler ». The form receives the date in a hidden input (yyyy-mm-dd), like a native field.
 */
export function PhoneDateField({
  id,
  name,
  label,
  value: controlled,
  defaultValue,
  onChange,
  min,
  max,
  required,
  className,
}: {
  id?: string;
  name?: string;
  /** The title of the calendar (« Date limite », « Nouvelle date de fin »). */
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
}) {
  const t = useTranslations("phone.calendar");
  const format = useFormatter();
  const [own, setOwn] = useState(defaultValue ?? "");
  const value = controlled ?? own;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const shown = parse(value);
  const close = () => setOpen(false);
  return (
    <>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button
        id={id}
        type="button"
        className={`nb-cal-champ${className ? ` ${className}` : ""}`}
        data-vide={shown ? undefined : ""}
        aria-label={`${label} · ${shown ? format.dateTime(shown, { dateStyle: "long", timeZone: "UTC" }) : t("pick")}`}
        onClick={() => {
          setDraft(value || min || todayIso());
          setOpen(true);
        }}
      >
        <PhoneIcon name="agenda" size={18} />
        <span>
          {shown
            ? format.dateTime(shown, {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })
            : t("pick")}
        </span>
      </button>
      <PhoneSheet open={open} onClose={close} label={label} closeLabel={t("cancel")}>
        {open ? (
          <JmCalendar
            title={label}
            value={draft}
            onChange={setDraft}
            min={min}
            max={max}
            footer={
              <div className="nb-cal-pied">
                <button
                  type="button"
                  className="nb-cal-ok"
                  disabled={!draft}
                  onClick={() => {
                    if (controlled === undefined) setOwn(draft);
                    onChange?.(draft);
                    close();
                  }}
                >
                  {t("confirm")}
                </button>
                <button type="button" className="nb-cal-non" onClick={close}>
                  {t("cancel")}
                </button>
              </div>
            }
          />
        ) : null}
      </PhoneSheet>
    </>
  );
}
