import type { PrismaClient } from "@/generated/prisma/client";
import { once } from "./billing-jobs";
import { NEW_APPLICATION_DIGEST } from "./notifications";

/** The summary leaves with the first hourly run after 7:00 UTC (8:00 in Kinshasa). */
export const DIGEST_HOUR_UTC = 7;
const DAY_MS = 86_400_000;

export type ApplicationDigest = {
  to: { id: string; email: string; firstName: string | null };
  org: string;
  jobs: { title: string; count: number }[];
};

/**
 * « Un résumé par jour » (évaluation recruteur, 06/11/2026): each member of a hiring team who
 * chose it gets, once a day, the new applications of the last 24 hours for each of their
 * organizations, one line per offer. Each summary is claimed once (JobRun), so the hourly task can
 * run again safely. Nothing is sent on a day without a new application.
 */
export async function dueApplicationDigests(
  db: PrismaClient,
  now = new Date(),
): Promise<ApplicationDigest[]> {
  if (now.getUTCHours() < DIGEST_HOUR_UTC) return [];
  const day = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - DAY_MS);
  const members = await db.membership.findMany({
    where: {
      status: "active",
      role: { in: ["org_owner", "org_admin", "recruiter"] },
      user: { notificationEmails: true, notificationsMuted: { has: NEW_APPLICATION_DIGEST } },
      organization: { suspendedAt: null },
    },
    select: {
      organizationId: true,
      organization: { select: { name: true } },
      user: {
        select: { id: true, email: true, firstName: true, notificationsMuted: true },
      },
    },
  });
  const digests: ApplicationDigest[] = [];
  for (const member of members) {
    if (member.user.notificationsMuted.includes("rh.applications")) continue;
    const rows = await db.application.groupBy({
      by: ["jobId"],
      where: {
        createdAt: { gte: since, lt: now },
        job: { organizationId: member.organizationId },
      },
      _count: { _all: true },
    });
    if (rows.length === 0) continue;
    const jobs = await db.job.findMany({
      where: { id: { in: rows.map((row) => row.jobId) } },
      select: { id: true, title: true },
    });
    const titles = new Map(jobs.map((job) => [job.id, job.title]));
    const lines = rows
      .map((row) => ({ title: titles.get(row.jobId) ?? "", count: row._count._all }))
      .filter((line) => line.title)
      .sort((a, b) => b.count - a.count);
    const claimed = await once(
      db,
      `digest:new-applications:${member.user.id}:${member.organizationId}:${day}`,
      async () => undefined,
    );
    if (!claimed) continue;
    digests.push({
      to: { id: member.user.id, email: member.user.email, firstName: member.user.firstName },
      org: member.organization.name,
      jobs: lines,
    });
  }
  return digests;
}
