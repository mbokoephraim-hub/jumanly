"use server";

import { notFound, redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { canWriteArea, type AdminArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { db } from "@/server/db";
import { mailModeration } from "@/server/hire-emails";
import {
  addReportNote,
  changesSchema,
  closeReport,
  closeReportSchema,
  reportNoteSchema,
  requestJobChanges,
} from "@/server/services/moderation";
import { hiringTeam, notify } from "@/server/services/notifications";

/**
 * Moderation of Jumanly Admin (Admin v2, étape 7): « Demander une correction » on a job, notes
 * and decisions on reports. Validate → session → role (support agents read only) → service.
 */
async function moderator(area: AdminArea) {
  const admin = await requireAdminArea(area);
  if (!admin) notFound();
  if (!canWriteArea(admin.platformRole, area)) redirect("/admin?erreur=lecture");
  return admin;
}

const reportsHref = (formData: FormData, extra: Record<string, string>) => {
  const back = String(formData.get("back") ?? "");
  const base = back.startsWith("/admin/signalements") ? back : "/admin/signalements";
  const url = new URL(base, "http://jumanly.local");
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  url.searchParams.delete("action");
  return `${url.pathname}${url.search}#signalement`;
};

export async function requestJobChangesAction(formData: FormData) {
  const input = changesSchema.safeParse({
    job: formData.get("job"),
    reason: formData.get("reason"),
    points: formData.getAll("points"),
  });
  const jobId = String(formData.get("job") ?? "").slice(0, 60);
  if (!input.success)
    redirect(`/admin/offres?id=${encodeURIComponent(jobId)}&action=correction&erreur=motif`);
  const admin = await moderator("jobs");
  const job = await requestJobChanges(db, admin.id, input.data);
  if (job) {
    updateTag("jobs");
    updateTag(`job:${job.slug}`);
    const team = await hiringTeam(db, job.organizationId);
    await notify(db, {
      userIds: team.map((member) => member.id),
      type: "jobChangesRequested",
      payload: { jobTitle: job.title },
      href: `/app/hire/offres/${job.id}`,
    });
  }
  redirect(`/admin/offres?ok=correction&id=${encodeURIComponent(jobId)}`);
}

export async function reportNoteAction(formData: FormData) {
  const input = reportNoteSchema.safeParse({
    report: formData.get("report"),
    note: formData.get("note"),
  });
  if (!input.success) redirect(reportsHref(formData, { erreur: "note" }));
  const admin = await moderator("reports");
  await addReportNote(db, admin.id, input.data);
  refresh();
  redirect(reportsHref(formData, { ok: "note" }));
}

export async function closeReportAction(formData: FormData) {
  const input = closeReportSchema.safeParse({
    report: formData.get("report"),
    decision: formData.get("decision"),
    reason: formData.get("reason"),
  });
  if (!input.success) redirect(reportsHref(formData, { erreur: "motif" }));
  const admin = await moderator("reports");
  const result = await closeReport(db, admin.id, input.data);
  if (result) {
    updateTag("jobs");
    // The author is warned; whoever reported learns it is done, never who did what.
    if (result.author) {
      await notify(db, {
        userIds: [result.author.id],
        type: "moderationWarning",
        payload: {},
        href: "/app",
      });
      await mailModeration(result.author, { kind: "warning", reason: input.data.reason });
    }
    const reporters = await db.user.findMany({
      where: { id: { in: result.reporterIds }, status: { not: "deleted" } },
      select: { id: true, email: true, firstName: true },
    });
    await notify(db, {
      userIds: reporters.map((person) => person.id),
      type: "reportClosed",
      payload: {},
      href: "/app/notifications",
    });
    await Promise.all(
      reporters.map((person) =>
        mailModeration(person, { kind: "reportClosed", decision: input.data.decision }),
      ),
    );
  }
  redirect(reportsHref(formData, { ok: "1" }));
}
