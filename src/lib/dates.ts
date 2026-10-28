import { intlLocale } from "./display-locale";

/**
 * Dates are stored in UTC and shown in the user's time zone. Public visitors are anonymous:
 * the default zone comes from DEFAULT_TIME_ZONE (partie 02).
 */
export function defaultTimeZone(): string {
  return process.env.DEFAULT_TIME_ZONE || "UTC";
}

export function formatDate(date: Date, timeZone = defaultTimeZone()): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** "2 oct. 2026": tables and lists where the long month would not fit. */
export function formatShortDate(date: Date, timeZone = defaultTimeZone()): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** "il y a 3 jours", "aujourd'hui", "hier". */
export function formatRelativeDays(date: Date, now = new Date()): string {
  const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  return new Intl.RelativeTimeFormat(intlLocale(), { numeric: "auto" }).format(days, "day");
}

/** "français", "anglais"… from an ISO 639-1 code. */
export function languageName(code: string): string {
  return new Intl.DisplayNames([intlLocale()], { type: "language" }).of(code) ?? code;
}

/** "il y a 2 jours", "il y a 1 semaine", "dans 3 jours": days, then weeks, then months. */
export function formatRelative(date: Date, now = new Date()): string {
  const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  const format = new Intl.RelativeTimeFormat(intlLocale(), { numeric: "auto" });
  if (Math.abs(days) < 7) return format.format(days, "day");
  if (Math.abs(days) < 30) return format.format(Math.trunc(days / 7), "week");
  return format.format(Math.trunc(days / 30), "month");
}

/** "15 oct. 2026, 14:05": journals, where the hour matters. */
export function formatDateTime(date: Date, timeZone = defaultTimeZone()): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

/** "30 oct.": dates of the current season on cards, where the year goes without saying. */
export function formatDayMonth(date: Date, timeZone = defaultTimeZone()): string {
  return new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "short", timeZone }).format(
    date,
  );
}
