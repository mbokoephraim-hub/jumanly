/**
 * Suivi (docs/ux-mobile-talent, prompt 5, screens 15-16 and 20-23): the talent's interviews and the
 * documents asked from them, from real data only, the most urgent first.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import {
  isClosedStatus,
  talentEventTypes,
  talentStatus,
  type TalentApplicationStatus,
} from "./applications";
import { openJobWhere } from "./jobs";

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
    // Chat v2: two reminders, an hour before and the day before (« ✓ Dans l’agenda »).
    ...["-PT1H", "-P1D"].flatMap((trigger) => [
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `TRIGGER:${trigger}`,
      `DESCRIPTION:${icsText(input.summary)}`,
      "END:VALARM",
    ]),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

// ─── Suivi, redrawn (planche talent-2 § 2 and 3) ─────────────────────────────────────────

/** What the talent has to do on an application, the most urgent first. */
export type SuiviAction =
  | { kind: "slot"; interviewId: string; before: Date | null }
  | { kind: "document"; name: string; due: Date | null }
  | { kind: "draft" };

export type SuiviCard = {
  id: string;
  href: string;
  title: string;
  company: string;
  logo: string | null;
  status: TalentApplicationStatus | "draft";
  /** Last change (en cours) or the end (terminées). */
  changedAt: Date;
  action: SuiviAction | null;
  /** « Ce n'est pas la fin du parcours » (non retenue): open offers near this one. */
  similar: { count: number; href: string } | null;
};

const pendingRequest = (payload: unknown) => {
  const value = (payload ?? {}) as { name?: string; due?: string; submittedAt?: string };
  return value.submittedAt
    ? null
    : { name: value.name ?? "", due: value.due ? new Date(value.due) : null };
};

/**
 * The applications of Suivi, grouped by situation: « À faire » (a slot to choose, a document to
 * send, a draft to finish), « En attente », and « Terminées ». Real statuses only.
 */
export async function suiviBoard(db: PrismaClient, userId: string, now = new Date()) {
  const [applications, drafts] = await Promise.all([
    db.application.findMany({
      where: { profile: { userId } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        viewedAt: true,
        createdAt: true,
        updatedAt: true,
        stage: { select: { kind: true } },
        events: {
          where: { type: { in: [...talentEventTypes] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        job: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            closesAt: true,
            contractType: true,
            country: true,
            organization: { select: { name: true, logo: true, sector: true } },
          },
        },
        interviews: {
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
          select: { id: true, slots: true },
        },
        conversation: {
          select: {
            messages: {
              where: { kind: "document_request", hiddenAt: null },
              orderBy: { createdAt: "desc" },
              select: { payload: true },
            },
          },
        },
      },
    }),
    db.applicationDraft.findMany({
      where: {
        userId,
        job: { ...openJobWhere(now), applications: { none: { profile: { userId } } } },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        updatedAt: true,
        job: {
          select: { slug: true, title: true, organization: { select: { name: true, logo: true } } },
        },
      },
    }),
  ]);

  const cards = await Promise.all(
    applications.map(async (application): Promise<SuiviCard> => {
      const status = talentStatus(application, now);
      const interview = application.interviews.find((item) =>
        item.slots.some((slot) => slot > now),
      );
      const request = (application.conversation?.messages ?? [])
        .map((message) => pendingRequest(message.payload))
        .find(Boolean);
      const closed = isClosedStatus(status);
      const action: SuiviAction | null = closed
        ? null
        : interview
          ? {
              kind: "slot",
              interviewId: interview.id,
              before:
                interview.slots.filter((slot) => slot > now).sort((a, b) => +a - +b)[0] ?? null,
            }
          : request
            ? { kind: "document", ...request }
            : null;
      let similar: SuiviCard["similar"] = null;
      if (status === "notSelected") {
        const sector = application.job.organization.sector;
        const count = await db.job.count({
          where: {
            AND: [
              openJobWhere(now),
              { id: { not: application.job.id } },
              { applications: { none: { profile: { userId } } } },
              sector
                ? { organization: { sector } }
                : {
                    OR: [
                      { contractType: application.job.contractType },
                      { country: application.job.country },
                    ],
                  },
            ],
          },
        });
        if (count > 0)
          similar = {
            count,
            href: sector ? `/app/jobs?secteur=${encodeURIComponent(sector)}` : "/app/jobs",
          };
      }
      return {
        id: application.id,
        href: `/app/suivi/${application.id}`,
        title: application.job.title,
        company: application.job.organization.name,
        logo: application.job.organization.logo,
        status,
        changedAt: application.events[0]?.createdAt ?? application.createdAt,
        action,
        similar,
      };
    }),
  );
  const draftCards: SuiviCard[] = drafts.map((draft) => ({
    id: `brouillon-${draft.job.slug}`,
    href: `/app/jobs/${draft.job.slug}/postuler`,
    title: draft.job.title,
    company: draft.job.organization.name,
    logo: draft.job.organization.logo,
    status: "draft",
    changedAt: draft.updatedAt,
    action: { kind: "draft" },
    similar: null,
  }));
  const active = cards.filter((card) => card.status !== "draft" && !isClosedStatus(card.status));
  const urgency = (card: SuiviCard) =>
    card.action?.kind === "slot" ? 0 : card.action?.kind === "document" ? 1 : 2;
  return {
    toDo: [...active.filter((card) => card.action), ...draftCards].sort(
      (a, b) => urgency(a) - urgency(b),
    ),
    waiting: active.filter((card) => !card.action),
    finished: cards.filter((card) => card.status !== "draft" && isClosedStatus(card.status)),
  };
}

/** One application of the talent, everything its page shows (planche talent-2 § 3). */
export async function suiviApplication(db: PrismaClient, userId: string, id: string) {
  const application = await db.application.findFirst({
    where: { id, profile: { userId } },
    select: {
      id: true,
      status: true,
      viewedAt: true,
      createdAt: true,
      coverLetter: true,
      cvSnapshot: true,
      attachments: true,
      stage: { select: { kind: true, name: true } },
      events: {
        where: { type: { in: [...talentEventTypes] } },
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, payload: true, createdAt: true },
      },
      job: {
        select: {
          slug: true,
          title: true,
          status: true,
          closesAt: true,
          organization: { select: { name: true, logo: true } },
        },
      },
      interviews: {
        where: { status: { in: ["pending", "reschedule", "confirmed"] } },
        orderBy: { createdAt: "desc" },
        select: interviewSelect,
      },
      conversation: {
        select: {
          id: true,
          messages: {
            where: { hiddenAt: null },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              kind: true,
              body: true,
              payload: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
      },
    },
  });
  if (!application) return null;
  const messages = application.conversation?.messages ?? [];
  const last =
    messages.find((message) => message.kind !== "system" && message.senderId !== userId) ?? null;
  const sender = last?.senderId
    ? await db.user.findUnique({ where: { id: last.senderId }, select: { name: true } })
    : null;
  return {
    ...application,
    talentStatus: talentStatus(application),
    lastMessage: last && { ...last, senderName: sender?.name ?? null },
    requests: messages.flatMap((message) => {
      if (message.kind !== "document_request") return [];
      const request = pendingRequest(message.payload);
      return request ? [{ id: message.id, ...request }] : [];
    }),
  };
}
