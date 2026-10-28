/**
 * The length of a video call as the Chat says it (« 40 s », « 12 min 40 s », « 1 h 5 min »):
 * the parts, shared by the server (the line in the conversation) and the phone (the toast).
 */
export function durationParts(seconds: number): {
  key: "short" | "long" | "hours";
  values: Record<string, number>;
} {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return { key: "short", values: { seconds: total } };
  if (total < 3600)
    return {
      key: "long" as const,
      values: { minutes: Math.floor(total / 60), seconds: total % 60 },
    };
  return {
    key: "hours" as const,
    values: { hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60) },
  };
}

/** « 00:12 », « 12:40 », « 1:05:00 »: the timer of a call in progress. */
export function callClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const pad = (value: number) => String(value).padStart(2, "0");
  const hours = Math.floor(total / 3600);
  const rest = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return hours ? `${hours}:${rest}` : rest;
}

/** A call nobody answered is closed after this long. */
export const RING_MAX_MS = 45_000;
