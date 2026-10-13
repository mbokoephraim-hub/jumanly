/** Formatting rules shared by the public pages. Texts come from `ui.duration.*`. */

export type DurationKey = "minutes" | "hours" | "hoursMinutes";

export function durationParts(totalMinutes: number): {
  key: DurationKey;
  values: { hours: number; minutes: number };
} {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  const key: DurationKey = hours === 0 ? "minutes" : minutes === 0 ? "hours" : "hoursMinutes";
  return { key, values: { hours, minutes } };
}
