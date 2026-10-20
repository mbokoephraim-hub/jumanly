/**
 * End-of-offer reminders (brief recruteur § 2.16 bis, planche recruteur-4 6 bis): J-3 by default,
 * J-7, J-1 and the last day as each member chooses (Paramètres › Messagerie et rappels). The
 * notification and the e-mail give the figures and four actions: analyse, statistics, prolong
 * (+7, +14, +30 days or a date) and close. Without an action the offer closes on its date.
 *
 * Daily background task `jobs.ending_reminders`. Each reminder of an offer is sent once
 * (`Job.endingReminders` keeps the keys already sent); prolonging the offer clears them, so the
 * reminders follow the new date, and so does an analysis scheduled at the closing (lot 6 ATS).
 * The day is counted in the platform's time zone (`DEFAULT_TIME_ZONE`): organizations have none.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { defaultTimeZone } from "@/lib/dates";
import { getOrgJob, HireError, hirePermissions, jobScope, type HireContext } from "./hire";
import { notify } from "./notifications";

export const endingReminderDays = ["d7", "d3", "d1", "d0"] as const;
export type EndingReminderDay = (typeof endingReminderDays)[number];
const daysOf: Record<EndingReminderDay, number> = { d7: 7, d3: 3, d1: 1, d0: 0 };

export const prolongOptions = [7, 14, 30] as const;
const DAY = 86_400_000;

/** « 2026-10-20 » in a time zone: the calendar day of an instant. */
function dayKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Whole calendar days from `now` to `closesAt` in the time zone (0 = the last day). */
export function daysLeft(closesAt: Date, now: Date, timeZone = defaultTimeZone()) {
  const a = Date.parse(`${dayKey(now, timeZone)}T00:00:00Z`);
  const b = Date.parse(`${dayKey(closesAt, timeZone)}T00:00:00Z`);
  return Math.round((b - a) / DAY);
}

/** The reminder due today for an offer, if any: J-7, J-3, J-1 or the last day. */
export function dueReminder(
  closesAt: Date,
  now: Date,
  sent: readonly string[],
  timeZone = defaultTimeZone(),
): EndingReminderDay | null {
  const left = daysLeft(closesAt, now, timeZone);
  const key = endingReminderDays.find((day) => daysOf[day] === left);
  return key && !sent.includes(key) ? key : null;
}

const personSelect = {
  id: true,
  email: true,
  firstName: true,
  endingReminders: true,
  notificationEmails: true,
} as const;

const sentOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export type EndingMail = {
  to: { id: string; email: string; firstName: string | null; notificationEmails: boolean };
  job: { id: string; title: string; closesAt: Date };
  days: number;
  figures: { applications: number; views: number; interviews: number };
};

/**
 * Sends the reminders due today. The person told is who created the offer (else the organization's
 * hiring team), only if they kept this day in their settings. Returns the e-mails to send.
 */
export async function runEndingReminders(db: PrismaClient, now = new Date()) {
  const jobs = await db.job.findMany({
    where: {
      status: "published",
      closesAt: { gte: new Date(now.getTime() - DAY), lte: new Date(now.getTime() + 8 * DAY) },
    },
    select: {
      id: true,
      title: true,
      closesAt: true,
      organizationId: true,
      createdById: true,
      endingReminders: true,
      _count: { select: { applications: true } },
    },
    take: 500,
  });
  const mails: EndingMail[] = [];
  for (const job of jobs) {
    const sent = sentOf(job.endingReminders);
    const key = dueReminder(job.closesAt!, now, sent);
    if (!key) continue;
    // Claimed once: another run that already wrote this key sends nothing.
    const claimed = await db.job.updateMany({
      where: { id: job.id, NOT: { endingReminders: { array_contains: [key] } } },
      data: { endingReminders: [...sent, key] },
    });
    if (claimed.count === 0) continue;
    const members = await db.membership.findMany({
      where: {
        organizationId: job.organizationId,
        status: "active",
        role: { in: ["org_owner", "org_admin", "recruiter"] },
        ...(job.createdById ? { userId: job.createdById } : {}),
      },
      select: { user: { select: personSelect } },
    });
    const people = (
      members.length > 0 || !job.createdById
        ? members
        : await db.membership.findMany({
            where: {
              organizationId: job.organizationId,
              status: "active",
              role: { in: ["org_owner", "org_admin"] },
            },
            select: { user: { select: personSelect } },
          })
    )
      .map((member) => member.user)
      .filter((user) => user.endingReminders.includes(key));
    if (people.length === 0) continue;
    const days = daysOf[key];
    const [views, interviews] = await Promise.all([
      db.jobViewDay.aggregate({ where: { jobId: job.id }, _sum: { count: true } }),
      db.interview.count({
        where: {
          organizationId: job.organizationId,
          application: { jobId: job.id },
          status: { notIn: ["canceled", "declined"] },
        },
      }),
    ]);
    await notify(db, {
      userIds: people.map((user) => user.id),
      type: "jobEnding",
      payload: { jobTitle: job.title, days },
      href: `/app/notifications#fin-${job.id}`,
    });
    for (const user of people)
      mails.push({
        to: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          notificationEmails: user.notificationEmails,
        },
        job: { id: job.id, title: job.title, closesAt: job.closesAt! },
        days,
        figures: {
          applications: job._count.applications,
          views: views._sum.count ?? 0,
          interviews,
        },
      });
  }
  return mails;
}

/**
 * « Prolonger » (+7, +14, +30 days or a date): the closing date moves, the reminders already sent
 * are forgotten so that they follow the new date; an analysis scheduled at the closing follows too.
 */
export async function prolongJob(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  input: { days?: number; until?: Date },
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  if (!["published", "paused"].includes(job.status)) throw new HireError("invalid");
  const from = job.closesAt && job.closesAt > now ? job.closesAt : now;
  const closesAt = input.until ? input.until : new Date(from.getTime() + (input.days ?? 0) * DAY);
  if (closesAt.getTime() <= now.getTime() || closesAt.getTime() > now.getTime() + 180 * DAY)
    throw new HireError("invalid");
  await db.job.update({ where: { id: job.id }, data: { closesAt, endingReminders: [] } });
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "job.prolong",
      targetType: "job",
      targetId: job.id,
      organizationId: ctx.organizationId,
      metadata: { closesAt: closesAt.toISOString() },
    },
  });
  return closesAt;
}

/**
 * The offers of the member closing within 7 days (Notifications, planche 6 bis `FIN`): the
 * figures and the actions. Read through the member's scope (golden rule n° 6).
 */
export async function endingOffers(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).readApplications) return [];
  const scope = await jobScope(db, ctx);
  const jobs = await db.job.findMany({
    where: {
      AND: [
        scope,
        { status: "published", closesAt: { gte: now, lte: new Date(now.getTime() + 7 * DAY) } },
      ],
    },
    orderBy: { closesAt: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      closesAt: true,
      atsAtClose: true,
      _count: { select: { applications: true } },
    },
  });
  const ids = jobs.map((job) => job.id);
  const [views, interviews] = await Promise.all([
    db.jobViewDay.groupBy({ by: ["jobId"], where: { jobId: { in: ids } }, _sum: { count: true } }),
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        application: { jobId: { in: ids } },
        status: { notIn: ["canceled", "declined"] },
      },
      select: { application: { select: { jobId: true } } },
    }),
  ]);
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    closesAt: job.closesAt!,
    days: daysLeft(job.closesAt!, now),
    atsAtClose: job.atsAtClose,
    figures: {
      applications: job._count.applications,
      views: views.find((row) => row.jobId === job.id)?._sum.count ?? 0,
      interviews: interviews.filter((row) => row.application.jobId === job.id).length,
    },
  }));
}
