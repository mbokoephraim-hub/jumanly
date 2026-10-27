/**
 * The hour (0–23) and the minute of a moment in a time zone, as numbers. `Intl` in French writes
 * « 10 h », which is not a number: the parts are read instead.
 */
export function clockParts(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);
  const read = (type: "hour" | "minute") =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { hour: read("hour"), minute: read("minute") };
}
