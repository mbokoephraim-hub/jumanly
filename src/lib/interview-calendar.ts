/**
 * Pure helpers of the interview calendar (recruteur lot 4, planches r2plus PROG, PROG2, AGENDA):
 * days in a time zone, the month grid, the team's busy blocks of a day, how full a day is, the
 * mornings when everybody is free and the next free slot Orbi may propose. Nothing here decides:
 * a suggestion is only added when the member taps it.
 */

const DAY = 86_400_000;

/** A calendar day as « YYYY-MM-DD » and the minutes since midnight, read in `timeZone`. */
export function zoned(date: Date, timeZone: string) {
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
    key: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Noon UTC of a day key: a safe instant for day arithmetic and for formatting the day itself. */
export const noonOf = (key: string) => new Date(`${key}T12:00:00Z`);
export const keyOfNoon = (date: Date) => date.toISOString().slice(0, 10);
export const addDays = (key: string, days: number) =>
  keyOfNoon(new Date(noonOf(key).getTime() + days * DAY));
/** 0 = Monday … 6 = Sunday. */
export const weekdayOf = (key: string) => (noonOf(key).getUTCDay() + 6) % 7;
export const mondayOf = (key: string) => addDays(key, -weekdayOf(key));
export const monthOf = (key: string) => key.slice(0, 7);

/** The weeks (Monday first) covering a month « YYYY-MM »; days of the other months included. */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const start = mondayOf(first);
  const weeks: string[][] = [];
  let day = start;
  do {
    const week: string[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  } while (monthOf(day) === month);
  return weeks;
}

export function nextMonth(month: string, step = 1) {
  const [year, value] = month.split("-").map(Number) as [number, number];
  const index = year * 12 + (value - 1) + step;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** A busy period of members of the team on one day, in minutes of that day. */
export type BusyBlock = {
  start: number;
  end: number;
  userIds: string[];
  /** A slot proposed to a candidate and not confirmed yet: it may still be taken. */
  tentative: boolean;
};

export type InterviewLike = {
  organizerId: string;
  participantIds: string[];
  status: string;
  startsAt: Date | null;
  slots: Date[];
  durationMinutes: number;
};

/**
 * The busy blocks of each day from the team's interviews in Jumanly (the only agendas Jumanly
 * reads): a confirmed interview, and each slot still proposed to a candidate.
 */
export function busyByDay(interviews: InterviewLike[], timeZone: string) {
  const days = new Map<string, BusyBlock[]>();
  const push = (date: Date, minutes: number, userIds: string[], tentative: boolean) => {
    const at = zoned(date, timeZone);
    const list = days.get(at.key) ?? [];
    list.push({
      start: at.minutes,
      end: Math.min(24 * 60, at.minutes + minutes),
      userIds,
      tentative,
    });
    days.set(at.key, list);
  };
  for (const interview of interviews) {
    const team = [interview.organizerId, ...interview.participantIds];
    if (interview.status === "confirmed" && interview.startsAt)
      push(interview.startsAt, interview.durationMinutes, team, false);
    else if (interview.status === "pending")
      for (const slot of interview.slots) push(slot, interview.durationMinutes, team, true);
  }
  for (const list of days.values()) list.sort((a, b) => a.start - b.start);
  return days;
}

/** The blocks of the chosen members only. */
export function blocksFor(blocks: BusyBlock[] | undefined, members: string[]) {
  return (blocks ?? []).filter((block) => block.userIds.some((id) => members.includes(id)));
}

/** Working hours shown in the day grid. */
export const DAY_START = 8 * 60;
export const DAY_END = 18 * 60;

export function overlaps(blocks: { start: number; end: number }[], start: number, end: number) {
  return blocks.some((block) => block.start < end && start < block.end);
}

/** « Équipe libre » (green dot), « Peu de place » (amber dot), or nothing (weekend, past). */
export function dayLoad(blocks: BusyBlock[]): "free" | "few" {
  const busy = blocks.reduce(
    (sum, block) =>
      sum + Math.max(0, Math.min(block.end, DAY_END) - Math.max(block.start, DAY_START)),
    0,
  );
  return busy >= 4 * 60 ? "few" : "free";
}

/** Weekdays (from `from`, within `days` days) whose morning (9:00 to 12:00) is free for all. */
export function freeMornings(
  byDay: Record<string, BusyBlock[]>,
  members: string[],
  from: string,
  days = 14,
  max = 2,
) {
  const found: string[] = [];
  for (let index = 0; index < days && found.length < max; index += 1) {
    const key = addDays(from, index);
    if (weekdayOf(key) > 4) continue;
    if (!overlaps(blocksFor(byDay[key], members), 9 * 60, 12 * 60)) found.push(key);
  }
  return found;
}

/**
 * The next slot (on the hour, 9:00 to 16:00, a weekday) where every chosen member is free and
 * that no chosen slot overlaps. `after`: minutes already gone on the first day (today).
 */
export function suggestSlot(
  byDay: Record<string, BusyBlock[]>,
  members: string[],
  chosen: string[],
  duration: number,
  from: string,
  after = 0,
  days = 21,
) {
  for (let index = 0; index < days; index += 1) {
    const key = addDays(from, index);
    if (weekdayOf(key) > 4) continue;
    const taken = [
      ...blocksFor(byDay[key], members),
      ...chosen
        .filter((slot) => slot.startsWith(key))
        .map((slot) => {
          const start = minutesOfSlot(slot);
          return { start, end: start + duration };
        }),
    ];
    for (let hour = 9; hour <= 16; hour += 1) {
      const start = hour * 60;
      if (index === 0 && start <= after) continue;
      if (start + duration > DAY_END) continue;
      if (!overlaps(taken, start, start + duration)) return slotOf(key, start);
    }
  }
  return null;
}

const pad = (value: number) => String(value).padStart(2, "0");
/** « 2026-10-22T10:30 », the value a slot travels as (read in the interview's time zone). */
export const slotOf = (key: string, minutes: number) =>
  `${key}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
export const minutesOfSlot = (slot: string) => {
  const [hours, minutes] = (slot.split("T")[1] ?? "00:00").split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};
export const clock = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** « Kinshasa (UTC+1) » from « Africa/Kinshasa », at a given instant. */
export function zoneLabel(timeZone: string, at = new Date()) {
  const city = (timeZone.split("/").pop() ?? timeZone).replaceAll("_", " ");
  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")?.value ?? "UTC";
  const utc = offset.replace("GMT", "UTC");
  return city === "UTC" ? utc : `${city} (${utc === "UTC" ? "UTC" : utc})`;
}

const capital = (text: string) => text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);
const formatUtc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...options });

/**
 * The words of each day, written once on the server so that the page and the browser show the
 * same text: « Mardi 22 octobre », « mar. 22 oct. », « M », « 22 », « octobre », « MAR ».
 */
export function dayLabels(from: string, count: number) {
  const long = formatUtc({ weekday: "long", day: "numeric", month: "long" });
  const short = formatUtc({ weekday: "short", day: "numeric", month: "short" });
  const weekday = formatUtc({ weekday: "short" });
  const month = formatUtc({ month: "long" });
  const labels: Record<
    string,
    { long: string; short: string; letter: string; day: string; month: string; weekday: string }
  > = {};
  for (let index = 0; index < count; index += 1) {
    const key = addDays(from, index);
    const date = noonOf(key);
    const name = weekday.format(date).replace(".", "");
    labels[key] = {
      long: capital(long.format(date)),
      short: short.format(date),
      letter: name.charAt(0).toLocaleUpperCase("fr"),
      day: String(Number(key.slice(8))),
      month: month.format(date),
      weekday: name.slice(0, 3).toLocaleUpperCase("fr"),
    };
  }
  return labels;
}

/** « Octobre 2026 » for each month from `from`'s month, `count` months. */
export function monthLabels(from: string, count: number) {
  const format = formatUtc({ month: "long", year: "numeric" });
  return Array.from({ length: count }, (_, index) => {
    const key = nextMonth(monthOf(from), index);
    return { key, label: capital(format.format(noonOf(`${key}-01`))) };
  });
}
