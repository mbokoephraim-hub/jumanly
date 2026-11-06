import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, jobScope, type HireContext } from "./hire";
import { deskSelect, rubriqueOf } from "./hire-desk";
import { HOLD_CHECK_EVENT, HOLD_EVENT, HOLD_LIFTED_EVENT, isOnHold } from "./hire-classes";
import { REVIEW_DAYS } from "./hire-offer-candidates";

/**
 * « Agenda », the recruiter's tab that replaced « Candidatures » (Ephraïm, 03/11/2026). Since
 * 05/11/2026 it only holds what takes a date (« Mois » and « À planifier »): interviews of the
 * retained, document checks of the people set aside. People waiting for an answer belong to
 * Offres (its badge and « À trier »), not here. Nothing here decides: each line opens the
 * candidate in their offer.
 */

const DAY = 86_400_000;

const plannedAt = (payload: unknown) => {
  const value = (payload as { checkAt?: unknown } | null)?.checkAt;
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export type AgendaReview = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  /** Null when the offer is sorted blind. */
  name: string | null;
  remindAt: Date;
  due: boolean;
  /** The check dated with « Délai de vérification » (06/11/2026), shown in « Mois ». */
  checkAt: Date | null;
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
  /** The day and hour the team planned to check the pieces (« Fixer la vérification »). */
  checkAt: Date | null;
};

/** Retained, file complete, no interview proposed yet: « À planifier ». */
export type AgendaToPlan = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  name: string | null;
  retainedAt: Date;
};

export type AgendaTasks = {
  reviews: AgendaReview[];
  pieces: AgendaPieces[];
  toPlan: AgendaToPlan[];
  /** What waits for a date now: retained without interview, reviews due, pieces late. */
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
    events: { type: string; createdAt: Date; payload?: unknown }[];
    /** The interviews still standing (proposed, confirmed, to move). */
    interviews?: { id: string }[];
    verification: {
      dueAt: Date;
      checkAt?: Date | null;
      items: { required: boolean; receivedAt: Date | null }[];
    } | null;
  }[],
  now: Date,
): AgendaTasks {
  const reviews: AgendaReview[] = [];
  const pieces: AgendaPieces[] = [];
  const toPlan: AgendaToPlan[] = [];
  for (const row of rows) {
    const rubrique = rubriqueOf(row);
    const name = row.job.blindSort && !row.shortlistedAt ? null : row.profile.user.name;
    const onHold = rubrique !== "decision" && isOnHold(row.events);
    // Pieces asked (which sets the person aside since 04/11/2026): « Vérification des documents »,
    // to date with « Fixer la date » (05/11/2026), even once every piece is in.
    if (row.verification && (rubrique === "completer" || onHold)) {
      const required = row.verification.items.filter((item) => item.required);
      pieces.push({
        applicationId: row.id,
        jobId: row.jobId,
        jobTitle: row.job.title,
        name,
        received: required.filter((item) => item.receivedAt).length,
        required: required.length,
        dueAt: row.verification.dueAt,
        late: row.verification.dueAt <= now && required.some((item) => !item.receivedAt),
        checkAt: row.verification.checkAt ?? null,
      });
    } else if (onHold) {
      // Set aside « En attente » without pieces asked: reminded after 3 days.
      const since = [...row.events].reverse().find((event) => event.type === HOLD_EVENT)!;
      // A « Délai de vérification » given since this hold replaces the 3 days.
      const planned = [...row.events]
        .reverse()
        .find((event) => event.type === HOLD_CHECK_EVENT && event.createdAt >= since.createdAt);
      const checkAt = planned ? plannedAt(planned.payload) : null;
      const remindAt = checkAt ?? new Date(since.createdAt.getTime() + REVIEW_DAYS * DAY);
      reviews.push({
        applicationId: row.id,
        jobId: row.jobId,
        jobTitle: row.job.title,
        name,
        remindAt,
        due: remindAt <= now,
        checkAt,
      });
    } else if (rubrique === "entretiens" && (row.interviews ?? []).length === 0) {
      toPlan.push({
        applicationId: row.id,
        jobId: row.jobId,
        jobTitle: row.job.title,
        name,
        retainedAt: row.shortlistedAt ?? row.createdAt,
      });
    }
  }
  reviews.sort(
    (a, b) => Number(b.due) - Number(a.due) || a.remindAt.getTime() - b.remindAt.getTime(),
  );
  pieces.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  return {
    reviews,
    pieces,
    toPlan: toPlan.sort((a, b) => a.retainedAt.getTime() - b.retainedAt.getTime()),
    due:
      toPlan.length +
      reviews.filter((item) => item.due).length +
      pieces.filter((item) => item.late && !item.checkAt).length,
  };
}

/** The tasks of every offer the member may read (`jobScope`), organization only. */
export async function agendaTasks(
  db: PrismaClient,
  ctx: HireContext,
  now = new Date(),
): Promise<AgendaTasks> {
  if (!hirePermissions(ctx.role).readApplications)
    return { reviews: [], pieces: [], toPlan: [], due: 0 };
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
        select: {
          dueAt: true,
          checkAt: true,
          items: { select: { required: true, receivedAt: true } },
        },
      },
      job: { select: { title: true, blindSort: true } },
      profile: { select: { user: { select: { name: true } } } },
      interviews: {
        where: { status: { in: ["pending", "confirmed", "reschedule"] } },
        select: { id: true },
      },
      events: {
        where: { type: { in: [HOLD_EVENT, HOLD_LIFTED_EVENT, HOLD_CHECK_EVENT] } },
        orderBy: { createdAt: "asc" },
        select: { type: true, createdAt: true, payload: true },
      },
    },
  });
  return agendaOf(rows, now);
}

/** A campaign in the agenda: a programmed opening, and the end of an offer. */
export type AgendaCampaign = {
  jobId: string;
  title: string;
  /** Set while the campaign waits to open by itself. */
  opensAt: Date | null;
  closesAt: Date | null;
};

/**
 * « Campagnes » of the Agenda (Ephraïm 05/11/2026): the programmed drafts (they open by themselves)
 * and the offers online or programmed that end on a date, organization only.
 */
export async function agendaCampaigns(
  db: PrismaClient,
  ctx: HireContext,
  now = new Date(),
): Promise<AgendaCampaign[]> {
  if (!hirePermissions(ctx.role).readApplications) return [];
  const jobs = await db.job.findMany({
    where: {
      AND: [
        await jobScope(db, ctx),
        { organizationId: ctx.organizationId },
        {
          OR: [
            { status: { in: ["draft", "changes_requested"] }, opensAt: { not: null } },
            {
              status: { in: ["published", "pending_review", "paused"] },
              closesAt: { gte: new Date(now.getTime() - 62 * DAY) },
            },
          ],
        },
      ],
    },
    orderBy: [{ opensAt: "asc" }, { closesAt: "asc" }],
    take: 200,
    select: { id: true, title: true, opensAt: true, closesAt: true },
  });
  return jobs.map((job) => ({
    jobId: job.id,
    title: job.title,
    opensAt: job.opensAt,
    closesAt: job.closesAt,
  }));
}
