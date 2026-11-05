import type { PrismaClient } from "@/generated/prisma/client";
import { publishJob } from "./hire";
import { postOfferToFeed } from "./job-feed-post";
import { hiringTeam, notify } from "./notifications";

/**
 * « Programmer la campagne » (Agenda, Ephraïm 05/11/2026): every hour, the drafts whose opening
 * time has come are published as the member who programmed them, with the same rules as a
 * publication by hand (limit of live offers, automatic check). The member is told either way; an
 * offer that could not open goes back to a plain draft, never published silently later.
 */
export async function runScheduledOpenings(db: PrismaClient, now = new Date()) {
  const due = await db.job.findMany({
    where: {
      opensAt: { not: null, lte: now },
      status: { in: ["draft", "changes_requested"] },
    },
    select: { id: true, title: true, slug: true, organizationId: true, opensById: true },
    take: 100,
  });
  const opened: string[] = [];
  for (const job of due) {
    // Claimed once: another run that read the same row changes nothing.
    const claimed = await db.job.updateMany({
      where: { id: job.id, opensAt: { not: null, lte: now } },
      data: { opensAt: null },
    });
    if (claimed.count === 0) continue;
    const membership = job.opensById
      ? await db.membership.findFirst({
          where: { userId: job.opensById, organizationId: job.organizationId, status: "active" },
          select: { role: true },
        })
      : null;
    const told = job.opensById
      ? [job.opensById]
      : (await hiringTeam(db, job.organizationId)).map((user) => user.id);
    const result = membership
      ? await publishJob(
          db,
          {
            userId: job.opensById!,
            organizationId: job.organizationId,
            role: membership.role,
          },
          job.id,
          now,
        ).catch(() => null)
      : null;
    const ok = result?.status === "published" || result?.status === "pending_review";
    if (result?.status === "published") await postOfferToFeed(db, job.id).catch(() => null);
    await notify(db, {
      userIds: told,
      type: ok ? "jobOpened" : "jobOpenFailed",
      payload: { jobTitle: job.title },
      href: `/app/hire/offres/${job.id}`,
    });
    if (ok) opened.push(job.slug);
  }
  return opened;
}
