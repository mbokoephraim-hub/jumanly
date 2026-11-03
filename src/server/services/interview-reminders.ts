import type { PrismaClient } from "@/generated/prisma/client";
import { notify } from "./notifications";

/**
 * « Rappel d'agenda » (Ephraïm, 03/11/2026): the day before a confirmed interview (within the next
 * 24 hours), the team that takes part and the candidate get one reminder. Run every hour with the
 * other tasks; each interview is reminded once (the notification itself is the mark).
 */
const DAY = 86_400_000;

/** « aujourd'hui à 10:00 » / « demain à 15:30 », in the interview's own time zone. */
export function whenLabel(startsAt: Date, now: Date, timezone: string) {
  const zone = (() => {
    try {
      new Intl.DateTimeFormat("fr-FR", { timeZone: timezone });
      return timezone;
    } catch {
      return "UTC";
    }
  })();
  const day = (date: Date) =>
    new Intl.DateTimeFormat("fr-CA", { timeZone: zone, dateStyle: "short" }).format(date);
  const time = new Intl.DateTimeFormat("fr-FR", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);
  const same = day(startsAt) === day(now);
  return { day: same ? "today" : "tomorrow", time };
}

export async function runInterviewReminders(db: PrismaClient, now = new Date()) {
  const soon = await db.interview.findMany({
    where: {
      status: "confirmed",
      startsAt: { gt: now, lte: new Date(now.getTime() + DAY) },
    },
    select: {
      id: true,
      startsAt: true,
      timezone: true,
      organizerId: true,
      participantIds: true,
      application: {
        select: {
          id: true,
          conversation: { select: { id: true } },
          profile: { select: { user: { select: { id: true, name: true } } } },
          job: {
            select: {
              title: true,
              blindSort: true,
              organization: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  let sent = 0;
  for (const interview of soon) {
    const already = await db.notification.findFirst({
      where: { type: "interviewSoon", payload: { path: ["interviewId"], equals: interview.id } },
      select: { id: true },
    });
    if (already) continue;
    const { application } = interview;
    const when = whenLabel(interview.startsAt!, now, interview.timezone);
    const base = {
      interviewId: interview.id,
      jobTitle: application.job.title,
      day: when.day,
      time: when.time,
    };
    const day = interview.startsAt!.toISOString().slice(0, 10);
    await notify(db, {
      userIds: [interview.organizerId, ...interview.participantIds],
      type: "interviewSoon",
      payload: { ...base, candidate: application.profile.user.name ?? "none" },
      href: `/app/hire/entretiens?jour=${day}`,
    });
    await notify(db, {
      userIds: [application.profile.user.id],
      type: "interviewSoon",
      payload: { ...base, company: application.job.organization.name },
      href: application.conversation
        ? `/app/messages/${application.conversation.id}`
        : `/app/jobs/candidatures/${application.id}`,
    });
    sent += 1;
  }
  return sent;
}
