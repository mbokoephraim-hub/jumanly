import type { AudienceKind, PrismaClient } from "@/generated/prisma/client";
import { AUDIENCE_PERIODS, type AudienceFigures, type AudiencePeriod } from "@/lib/audience";

/**
 * Mon profil › Statistiques (demande d'Ephraïm du 29/10/2026): who came to a person's profile,
 * who opened their posts, how often their posts were shown in someone's Fil. One row per viewer,
 * day and profile or post (`AudienceEvent`), so a refresh never counts twice; one's own visits
 * never count. Only totals are ever read back: the owner never learns who.
 */

const DAY = 86_400_000;

/** Midnight UTC of a date: the day a row counts for. */
export function dayOf(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

type Seen = { kind: AudienceKind; ownerId: string; targetId: string };

/**
 * Notes what a viewer saw. Never throws: a page shown must not fail for a statistic.
 */
export async function recordAudience(
  db: PrismaClient,
  viewerId: string,
  seen: Seen[],
  now = new Date(),
) {
  const rows = seen.filter((item) => item.ownerId !== viewerId);
  if (rows.length === 0) return;
  const day = dayOf(now);
  try {
    await db.audienceEvent.createMany({
      data: rows.map((item) => ({ ...item, viewerId, day })),
      skipDuplicates: true,
    });
  } catch {
    // A statistic that could not be written is simply lost.
  }
}

/** A visit to a person's profile. */
export function recordProfileVisit(db: PrismaClient, viewerId: string, ownerId: string) {
  return recordAudience(db, viewerId, [{ kind: "profile_visit", ownerId, targetId: ownerId }]);
}

/** The posts of people (not organizations) shown in a viewer's Fil. */
export function recordImpressions(
  db: PrismaClient,
  viewerId: string,
  posts: { id: string; authorId: string | null; organizationId?: string | null }[],
) {
  return recordAudience(
    db,
    viewerId,
    posts.flatMap((post) =>
      post.authorId && !post.organizationId
        ? [{ kind: "post_impression" as const, ownerId: post.authorId, targetId: post.id }]
        : [],
    ),
  );
}

/**
 * The person's figures over the last 7, 30 and 90 days, read at once (the screen switches between
 * them without waiting).
 */
export async function audienceStats(
  db: PrismaClient,
  ownerId: string,
  now = new Date(),
): Promise<Record<AudiencePeriod, AudienceFigures>> {
  const today = dayOf(now);
  const longest = Math.max(...AUDIENCE_PERIODS);
  const since = new Date(today.getTime() - (2 * longest - 1) * DAY);
  const rows = await db.audienceEvent.groupBy({
    by: ["kind", "day"],
    where: { ownerId, day: { gte: since } },
    _count: { _all: true },
  });
  const figures = (days: AudiencePeriod): AudienceFigures => {
    const start = today.getTime() - (days - 1) * DAY;
    const earlier = start - days * DAY;
    const sum = (kind: AudienceKind, from: number, to: number) =>
      rows
        .filter((row) => row.kind === kind && row.day.getTime() >= from && row.day.getTime() < to)
        .reduce((total, row) => total + row._count._all, 0);
    const end = today.getTime() + DAY;
    const step = days === 90 ? 7 : 1;
    const count = Math.ceil(days / step);
    const bars = Array.from({ length: count }, (_, index) => {
      const to = end - (count - 1 - index) * step * DAY;
      return sum("profile_visit", Math.max(start, to - step * DAY), to);
    });
    return {
      visits: sum("profile_visit", start, end),
      views: sum("post_view", start, end),
      impressions: sum("post_impression", start, end),
      before: {
        visits: sum("profile_visit", earlier, start),
        views: sum("post_view", earlier, start),
        impressions: sum("post_impression", earlier, start),
      },
      bars,
    };
  };
  return { 7: figures(7), 30: figures(30), 90: figures(90) };
}
