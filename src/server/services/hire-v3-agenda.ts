/**
 * Agenda of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, `V.agenda`): the
 * interviews of the day, the week (Monday to Friday, 8 h to 18 h) or the month, in the member's
 * time zone, the next interview, the free hours of the week, and the candidates a free hour can
 * be proposed to. Real interviews only, scoped to the organization (golden rule n° 6).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, jobScope, type HireContext } from "./hire";

const DAY = 86_400_000;
export const AGENDA_VIEWS = ["jour", "semaine", "mois"] as const;
export type AgendaView = (typeof AGENDA_VIEWS)[number];
export const AGENDA_H0 = 8;
export const AGENDA_H1 = 18;

/** The calendar day and the hour (decimal) of an instant in a time zone. */
export function localParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
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
  const key = `${parts.year}-${parts.month}-${parts.day}`;
  return { key, hour: Number(parts.hour) + Number(parts.minute) / 60 };
}

/** The UTC instant of a local calendar day at an hour, in a time zone. */
export function zonedInstant(key: string, hour: number, timeZone: string) {
  const guess = new Date(`${key}T00:00:00Z`).getTime() + hour * 3_600_000;
  const offset = (instant: number) => {
    const { key: k, hour: h } = localParts(new Date(instant), timeZone);
    return new Date(`${k}T00:00:00Z`).getTime() + h * 3_600_000 - instant;
  };
  return new Date(guess - offset(guess - offset(guess)));
}

const addDays = (key: string, days: number) =>
  new Date(new Date(`${key}T00:00:00Z`).getTime() + days * DAY).toISOString().slice(0, 10);
const weekday = (key: string) => (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7;

export async function agendaV3(
  db: PrismaClient,
  ctx: HireContext,
  view: AgendaView,
  anchor: string | null,
  timeZone: string,
  now = new Date(),
) {
  const today = localParts(now, timeZone).key;
  const focus = anchor && /^\d{4}-\d{2}-\d{2}$/.test(anchor) ? anchor : today;
  const monday = addDays(focus, -weekday(focus));
  const monthStart = `${focus.slice(0, 7)}-01`;
  const days =
    view === "jour"
      ? [focus]
      : view === "semaine"
        ? Array.from({ length: 5 }, (_, i) => addDays(monday, i))
        : (() => {
            const first = addDays(monthStart, -weekday(monthStart));
            const next = addDays(`${focus.slice(0, 7)}-28`, 4).slice(0, 7);
            const last = addDays(`${next}-01`, -1);
            const end = addDays(last, 6 - weekday(last));
            const list: string[] = [];
            for (let d = first; d <= end; d = addDays(d, 1)) list.push(d);
            return list;
          })();
  const from = zonedInstant(days[0]!, 0, timeZone);
  const to = zonedInstant(addDays(days[days.length - 1]!, 1), 0, timeZone);
  const scope = await jobScope(db, ctx);
  const weekFrom = zonedInstant(monday, 0, timeZone);
  const weekTo = zonedInstant(addDays(monday, 5), 0, timeZone);
  const select = {
    id: true,
    startsAt: true,
    durationMinutes: true,
    mode: true,
    link: true,
    address: true,
    status: true,
    participantIds: true,
    application: {
      select: {
        id: true,
        stage: { select: { kind: true } },
        job: { select: { title: true } },
        profile: { select: { user: { select: { name: true } } } },
      },
    },
  } as const;
  const where = {
    organizationId: ctx.organizationId,
    application: { job: scope },
    status: { in: ["confirmed" as const, "done" as const] },
  };
  const [events, week, upcoming, invitable] = await Promise.all([
    db.interview.findMany({
      where: { ...where, startsAt: { gte: from, lt: to } },
      orderBy: { startsAt: "asc" },
      select,
    }),
    db.interview.findMany({
      where: { ...where, startsAt: { gte: weekFrom, lt: weekTo } },
      select: { startsAt: true, durationMinutes: true },
    }),
    db.interview.findFirst({
      where: { ...where, status: "confirmed", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      select,
    }),
    hirePermissions(ctx.role).manage
      ? db.application.findMany({
          where: {
            status: "active",
            job: scope,
            stage: { kind: { in: ["new", "screening", "test", "interview"] } },
          },
          orderBy: [{ matchScore: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
          take: 5,
          select: {
            id: true,
            matchScore: true,
            job: { select: { title: true } },
            profile: { select: { user: { select: { name: true } } } },
          },
        })
      : [],
  ]);
  const shape = (e: (typeof events)[number]) => {
    const local = localParts(e.startsAt!, timeZone);
    return {
      id: e.id,
      day: local.key,
      hour: local.hour,
      length: e.durationMinutes / 60,
      startsAt: e.startsAt!,
      mode: e.mode,
      link: e.link,
      address: e.address,
      done:
        e.status === "done" || e.startsAt!.getTime() + e.durationMinutes * 60_000 < now.getTime(),
      name: e.application.profile.user.name,
      applicationId: e.application.id,
      job: e.application.job.title,
      kind: e.application.stage.kind,
    };
  };
  // Free hours of the working week (8 h to 18 h, lunch at noon kept), from now on.
  const busy = (key: string, h: number) =>
    week.some((e) => {
      const local = localParts(e.startsAt!, timeZone);
      return local.key === key && h + 1 > local.hour && h < local.hour + e.durationMinutes / 60;
    });
  let free = 0;
  for (let i = 0; i < 5; i++) {
    const key = addDays(monday, i);
    for (let h = AGENDA_H0; h < AGENDA_H1; h++) {
      if (h === 12) continue;
      if (zonedInstant(key, h, timeZone) <= now) continue;
      if (!busy(key, h)) free++;
    }
  }
  return {
    view,
    today,
    focus,
    days,
    monthStart,
    prev:
      view === "jour"
        ? addDays(focus, -1)
        : view === "semaine"
          ? addDays(monday, -7)
          : addDays(monthStart, -1).slice(0, 7) + "-01",
    next:
      view === "jour"
        ? addDays(focus, 1)
        : view === "semaine"
          ? addDays(monday, 7)
          : addDays(addDays(monthStart, 31).slice(0, 7) + "-01", 0),
    nowHour: localParts(now, timeZone).hour,
    events: events.map(shape),
    weekCount: week.length,
    free,
    upcoming: upcoming ? shape(upcoming) : null,
    invitable: invitable.map((a) => ({
      id: a.id,
      name: a.profile.user.name,
      job: a.job.title,
      score: a.matchScore,
    })),
  };
}

export type AgendaV3 = Awaited<ReturnType<typeof agendaV3>>;
export { addDays as agendaAddDays, weekday as agendaWeekday };
