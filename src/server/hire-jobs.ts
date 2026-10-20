/**
 * Background tasks of the recruiter space, lot 6 (called with the billing tasks, every hour):
 * `ats.scheduled` (analyses programmed at the closing of an offer, and the files added after),
 * `jobs.ending_reminders` (J-7, J-3, J-1, the last day), and the join requests left 7 days without
 * an answer. Every task is safe to run often: each reminder and each analysis is claimed once.
 */
import "server-only";
import { db } from "@/server/db";
import { mailEnding } from "@/server/hire-emails";
import { reportError } from "@/server/observability";
import { runScheduledAts } from "@/server/services/hire-ats";
import { expireJoinRequests } from "@/server/services/org-join";
import { runEndingReminders } from "@/server/services/job-reminders";

export async function runHireJobs(now = new Date()) {
  const ats = await runScheduledAts(db, now).catch((error) => {
    reportError(error);
    return { launched: 0, added: 0 };
  });
  const reminders = await runEndingReminders(db, now);
  for (const mail of reminders) {
    if (!mail.to.notificationEmails) continue;
    await mailEnding(mail.to, {
      jobTitle: mail.job.title,
      days: mail.days,
      date: mail.job.closesAt,
      ...mail.figures,
      href: `/app/hire/offres/${mail.job.id}`,
    });
  }
  const expiredJoinRequests = await expireJoinRequests(db, now);
  return { ats, endingReminders: reminders.length, expiredJoinRequests };
}
