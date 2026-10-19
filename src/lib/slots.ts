/** « Kinshasa » for « Africa/Kinshasa »: the city a time zone is named after. */
export function zoneCity(timeZone: string) {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

/** « 2026-10-27 » and « 10:00 » of a date, in a time zone. */
export function localParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}
