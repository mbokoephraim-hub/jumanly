/**
 * Suivi (docs/ux-mobile-talent, prompt 5, screens 15-16 and 20-23): the talent's interviews and the
 * documents asked from them, from real data only, the most urgent first.
 */
import type { PrismaClient } from "@/generated/prisma/client";

const interviewSelect = {
  id: true,
  status: true,
  mode: true,
  durationMinutes: true,
  slots: true,
  proposedSlots: true,
  startsAt: true,
  timezone: true,
  link: true,
  address: true,
  message: true,
  updatedAt: true,
  organizer: { select: { name: true } },
  organization: { select: { name: true } },
  application: {
    select: {
      job: { select: { title: true, slug: true } },
      conversation: { select: { id: true } },
    },
  },
} as const;

export type TalentInterview = Awaited<ReturnType<typeof talentInterviews>>[number];

/**
 * Interviews still ahead: to confirm (a proposed slot to come), waiting for the recruiter (the
 * talent proposed other times), and confirmed ones until they end. To confirm first, then by date.
 */
export async function talentInterviews(db: PrismaClient, userId: string, now = new Date()) {
  const rows = await db.interview.findMany({
    where: {
      application: { profile: { userId }, status: "active" },
      status: { in: ["pending", "reschedule", "confirmed"] },
    },
    select: interviewSelect,
  });
  const ends = (start: Date, minutes: number) => start.getTime() + minutes * 60_000;
  const upcoming = rows.filter((row) =>
    row.status === "confirmed"
      ? row.startsAt !== null && ends(row.startsAt, row.durationMinutes) >= now.getTime()
      : row.status === "pending"
        ? row.slots.some((slot) => slot > now)
        : true,
  );
  const rank = { pending: 0, confirmed: 1, reschedule: 2 } as const;
  const when = (row: (typeof rows)[number]) =>
    (row.startsAt ?? row.slots.find((slot) => slot > now) ?? row.updatedAt).getTime();
  return upcoming.sort(
    (a, b) =>
      rank[a.status as keyof typeof rank] - rank[b.status as keyof typeof rank] ||
      when(a) - when(b),
  );
}

/** One interview of the talent, whatever its state (confirm and propose screens, calendar file). */
export function talentInterview(db: PrismaClient, userId: string, id: string) {
  return db.interview.findFirst({
    where: { id, application: { profile: { userId } } },
    select: interviewSelect,
  });
}

/** Documents a recruiter asked for and the talent has not sent yet. */
export async function pendingDocumentRequests(db: PrismaClient, userId: string) {
  const requests = await db.message.findMany({
    where: {
      kind: "document_request",
      hiddenAt: null,
      conversation: { talentUserId: userId, blockedAt: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      payload: true,
      createdAt: true,
      conversationId: true,
      conversation: {
        select: {
          organization: { select: { name: true } },
          application: { select: { job: { select: { title: true } } } },
        },
      },
    },
  });
  return requests.flatMap((request) => {
    const payload = (request.payload ?? {}) as {
      name?: string;
      due?: string;
      submittedAt?: string;
    };
    if (payload.submittedAt) return [];
    return [
      {
        id: request.id,
        conversationId: request.conversationId,
        name: payload.name ?? "",
        due: payload.due ? new Date(payload.due) : null,
        company: request.conversation.organization?.name ?? "",
        jobTitle: request.conversation.application?.job.title ?? "",
      },
    ];
  });
}

/** A date in UTC as a calendar file writes it (RFC 5545): « 20261023T090000Z ». */
function icsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Text of a calendar field: backslashes, commas, semicolons and line breaks escaped. */
function icsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\r?\n/g, "\\n");
}

/** « Ajouter à mon agenda » (screen 22): a confirmed interview as an .ics file. */
export function interviewCalendar(input: {
  id: string;
  startsAt: Date;
  durationMinutes: number;
  summary: string;
  description: string;
  location: string;
  now?: Date;
}) {
  const end = new Date(input.startsAt.getTime() + input.durationMinutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jumanly//Suivi//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.id}@jumanly.io`,
    `DTSTAMP:${icsDate(input.now ?? new Date())}`,
    `DTSTART:${icsDate(input.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(input.summary)}`,
    ...(input.description ? [`DESCRIPTION:${icsText(input.description)}`] : []),
    ...(input.location ? [`LOCATION:${icsText(input.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
