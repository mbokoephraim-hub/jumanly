import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, jobScope, type HireContext } from "./hire";
import { deskSelect, rubriqueOf } from "./hire-desk";
import { HOLD_EVENT, HOLD_LIFTED_EVENT, isOnHold } from "./hire-classes";
import { REVIEW_DAYS, WAITING_DAYS } from "./hire-offer-candidates";

/**
 * « Agenda », the recruiter's tab that replaced « Candidatures » (Ephraïm, 03/11/2026): what is
 * to do today, whatever the offer. Offres answers « what to do on this offer? », Agenda « what do
 * I do today? ». Nothing here decides: each line opens the candidate in their offer.
 */

const DAY = 86_400_000;

export type AgendaReview = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  /** Null when the offer is sorted blind. */
  name: string | null;
  remindAt: Date;
  due: boolean;
};

export type AgendaPieces = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  name: string | null;
  received: number;
  required: number;
  dueAt: Date;
  late: boolean;
};

export type AgendaWaiting = { jobId: string; jobTitle: string; count: number };

export type AgendaTasks = {
  reviews: AgendaReview[];
  pieces: AgendaPieces[];
  waiting: AgendaWaiting[];
  /** What is due now: reviews due, pieces late, offers with people waiting. */
  due: number;
};

/** The pure part, testable without a database. */
export function agendaOf(
  rows: {
    id: string;
    jobId: string;
    createdAt: Date;
    status: Parameters<typeof rubriqueOf>[0]["status"];
    shortlistedAt: Date | null;
    job: { title: string; blindSort: boolean };
    profile: { user: { name: string | null } };
    events: { type: string; createdAt: Date }[];
    verification: {
      dueAt: Date;
      items: { required: boolean; receivedAt: Date | null }[];
    } | null;
  }[],
  now: Date,
): AgendaTasks {
  const reviews: AgendaReview[] = [];
  const pieces: AgendaPieces[] = [];
  const waiting = new Map<string, AgendaWaiting>();
  for (const row of rows) {
    const rubrique = rubriqueOf(row);
    const name = row.job.blindSort && !row.shortlistedAt ? null : row.profile.user.name;
    if (rubrique === "trier" && isOnHold(row.events)) {
      const since = [...row.events].reverse().find((event) => event.type === HOLD_EVENT)!;
      const remindAt = new Date(since.createdAt.getTime() + REVIEW_DAYS * DAY);
      reviews.push({
        applicationId: row.id,
        jobId: row.jobId,
        jobTitle: row.job.title,
        name,
        remindAt,
        due: remindAt <= now,
      });
    } else if (
      rubrique === "trier" &&
      row.createdAt.getTime() < now.getTime() - WAITING_DAYS * DAY
    ) {
      const entry = waiting.get(row.jobId) ?? {
        jobId: row.jobId,
        jobTitle: row.job.title,
        count: 0,
      };
      entry.count += 1;
      waiting.set(row.jobId, entry);
    } else if (rubrique === "completer" && row.verification) {
      const required = row.verification.items.filter((item) => item.required);
      pieces.push({
        applicationId: row.id,
        jobId: row.jobId,
        jobTitle: row.job.title,
        name,
        received: required.filter((item) => item.receivedAt).length,
        required: required.length,
        dueAt: row.verification.dueAt,
        late: row.verification.dueAt <= now,
      });
    }
  }
  reviews.sort(
    (a, b) => Number(b.due) - Number(a.due) || a.remindAt.getTime() - b.remindAt.getTime(),
  );
  pieces.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const list = [...waiting.values()].sort((a, b) => b.count - a.count);
  return {
    reviews,
    pieces,
    waiting: list,
    due:
      reviews.filter((item) => item.due).length +
      pieces.filter((item) => item.late).length +
      list.length,
  };
}

/** The tasks of every offer the member may read (`jobScope`), organization only. */
export async function agendaTasks(
  db: PrismaClient,
  ctx: HireContext,
  now = new Date(),
): Promise<AgendaTasks> {
  if (!hirePermissions(ctx.role).readApplications)
    return { reviews: [], pieces: [], waiting: [], due: 0 };
  const rows = await db.application.findMany({
    where: {
      status: "active",
      job: { ...(await jobScope(db, ctx)), organizationId: ctx.organizationId },
    },
    take: 1000,
    select: {
      id: true,
      jobId: true,
      createdAt: true,
      ...deskSelect,
      verification: {
        select: { dueAt: true, items: { select: { required: true, receivedAt: true } } },
      },
      job: { select: { title: true, blindSort: true } },
      profile: { select: { user: { select: { name: true } } } },
      events: {
        where: { type: { in: [HOLD_EVENT, HOLD_LIFTED_EVENT] } },
        orderBy: { createdAt: "asc" },
        select: { type: true, createdAt: true },
      },
    },
  });
  return agendaOf(rows, now);
}
