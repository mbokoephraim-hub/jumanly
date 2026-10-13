/**
 * Dates are stored in UTC and shown in the user's time zone. Public visitors are anonymous:
 * the default zone comes from DEFAULT_TIME_ZONE (partie 02).
 */
export function defaultTimeZone(): string {
  return process.env.DEFAULT_TIME_ZONE || "UTC";
}

export function formatDate(date: Date, timeZone = defaultTimeZone()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** "il y a 3 jours", "aujourd'hui", "hier". */
export function formatRelativeDays(date: Date, now = new Date()): string {
  const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  return new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" }).format(days, "day");
}

/** "français", "anglais"… from an ISO 639-1 code. */
export function languageName(code: string): string {
  return new Intl.DisplayNames(["fr-FR"], { type: "language" }).of(code) ?? code;
}
