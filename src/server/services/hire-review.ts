import type { PrismaClient } from "@/generated/prisma/client";
import { HOLD_EVENT, HOLD_LIFTED_EVENT } from "./hire-classes";
import { REVIEW_DAYS } from "./hire-offer-candidates";
import { hiringTeam, notify } from "./notifications";

/** Marks that the reminder of a hold was sent (once per hold). */
export const REVIEW_REMINDED_EVENT = "review_reminded";
const DAY = 86_400_000;

/**
 * « À revoir » (Ephraïm, 03/11/2026): REVIEW_DAYS after a candidate was set aside with
 * « En attente », the member who did it (else the hiring team) is told, once. A candidate retained,
 * answered or put back in the list in the meantime is not.
 */
export async function runReviewReminders(db: PrismaClient, now = new Date()) {
  const holds = await db.applicationEvent.findMany({
    where: {
      type: HOLD_EVENT,
      createdAt: { lte: new Date(now.getTime() - REVIEW_DAYS * DAY) },
      application: { status: "active", shortlistedAt: null },
    },
    select: {
      id: true,
      actorId: true,
      createdAt: true,
      application: {
        select: {
          id: true,
          profile: { select: { user: { select: { name: true } } } },
          job: { select: { id: true, title: true, blindSort: true, organizationId: true } },
          events: {
            where: { type: { in: [HOLD_EVENT, HOLD_LIFTED_EVENT, REVIEW_REMINDED_EVENT] } },
            orderBy: { createdAt: "asc" },
            select: { id: true, type: true, createdAt: true },
          },
        },
      },
    },
  });
  let sent = 0;
  for (const hold of holds) {
    const { application } = hold;
    const after = application.events.filter((event) => event.createdAt >= hold.createdAt);
    // Only the last hold counts, still standing, never reminded yet.
    if (after.some((event) => event.type !== REVIEW_REMINDED_EVENT && event.id !== hold.id))
      continue;
    if (after.some((event) => event.type === REVIEW_REMINDED_EVENT)) continue;
    const team = hold.actorId
      ? [hold.actorId]
      : (await hiringTeam(db, application.job.organizationId)).map((user) => user.id);
    await db.applicationEvent.create({
      data: { applicationId: application.id, actorId: null, type: REVIEW_REMINDED_EVENT },
    });
    await notify(db, {
      userIds: team,
      type: "reviewReminder",
      payload: {
        jobTitle: application.job.title,
        candidate: application.job.blindSort ? "none" : (application.profile.user.name ?? "none"),
      },
      href: `/app/hire/offres/${application.job.id}?vue=candidats&de=trier&fiche=${application.id}`,
    });
    sent += 1;
  }
  return sent;
}
