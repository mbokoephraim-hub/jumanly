"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { onMessageSent, onStageChanged } from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire, setActiveSpace } from "@/server/hire-context";
import { requireUser } from "@/server/auth/session";
import { ensureApplicationConversation, sendMessage } from "@/server/services/connect";
import { addTeamNote } from "@/server/services/evaluation";
import {
  closeJob,
  deleteDraft,
  HireError,
  moveApplication,
  publishJob,
  rejectApplication,
  rejectReasons,
  saveJob,
} from "@/server/services/hire";
import { hireMemberships } from "@/server/services/organization";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

/** Public job pages are cached: a change in Hire refreshes them. */
function refreshPublicJobs(slug?: string) {
  updateTag("jobs");
  if (slug) updateTag(`job:${slug}`);
}

async function guarded<T>(work: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HireError) redirect(fallback);
    throw error;
  }
}

// ─── Space switcher ───────────────────────────────────────────────────────────

export async function switchSpace(formData: FormData) {
  const user = await requireUser("/app");
  const wanted = id(formData.get("space"));
  if (wanted === "personal") {
    await setActiveSpace("personal");
    redirect("/app");
  }
  const memberships = await hireMemberships(db, user.id);
  if (!memberships.some((membership) => membership.organizationId === wanted)) redirect("/app");
  await setActiveSpace(wanted);
  const suite = String(formData.get("suite") ?? "");
  redirect(suite.startsWith("/app/") && !suite.startsWith("//") ? suite : "/app/hire");
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function saveJobAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const jobId = id(formData.get("id")) || undefined;
  const intent = formData.get("intent") === "publish" ? "publish" : "draft";
  const result = await guarded(
    () => saveJob(db, ctx, Object.fromEntries(formData), jobId),
    "/app/hire/offres",
  );
  if (!result.ok) {
    const params = new URLSearchParams({ erreur: result.error, champ: result.field ?? "" });
    if (result.unknownSkills) params.set("inconnues", result.unknownSkills.join(", "));
    // The form keeps nothing on its own: a new job is saved as a draft only once valid.
    redirect(
      `${jobId ? `/app/hire/offres/${jobId}/modifier` : "/app/hire/offres/nouvelle"}?${params}`,
    );
  }
  const job = await db.job.findUniqueOrThrow({
    where: { id: result.jobId },
    select: { slug: true, status: true },
  });
  if (job.status === "published") refreshPublicJobs(job.slug);
  if (intent === "draft") redirect(`/app/hire/offres/${result.jobId}/modifier?ok=brouillon`);
  await publishAndRedirect(result.jobId);
}

async function publishAndRedirect(jobId: string): Promise<never> {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const result = await guarded(() => publishJob(db, ctx, jobId), "/app/hire/offres");
  if (result.status === "limit")
    redirect(`/app/hire/offres/${jobId}/modifier?erreur=limite&max=${result.max}`);
  if (result.status === "incomplete")
    redirect(`/app/hire/offres/${jobId}/modifier?erreur=minRequired&champ=requiredSkills`);
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { slug: true } });
  refreshPublicJobs(job.slug);
  redirect(
    `/app/hire/offres/${jobId}?publiee=${result.status === "published" ? "1" : "verification"}`,
  );
}

export async function publishJobAction(formData: FormData) {
  await publishAndRedirect(id(formData.get("id")));
}

export async function closeJobAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const jobId = id(formData.get("id"));
  await guarded(() => closeJob(db, ctx, jobId), "/app/hire/offres");
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { slug: true } });
  refreshPublicJobs(job.slug);
  redirect("/app/hire/offres?onglet=fermees&ok=fermee");
}

export async function deleteDraftAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  await guarded(() => deleteDraft(db, ctx, id(formData.get("id"))), "/app/hire/offres");
  redirect("/app/hire/offres?onglet=brouillons");
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/** Where to come back after an action on a candidate: the pipeline or the application page. */
function back(formData: FormData, applicationId: string, params = "") {
  const from = String(formData.get("back") ?? "");
  const base =
    from.startsWith("/app/hire/") && !from.startsWith("//")
      ? from.split("?")[0]!
      : `/app/hire/candidats/${applicationId}`;
  redirect(params ? `${base}?${params}` : base);
}

export async function moveApplicationAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const stageId = id(formData.get("stage"));
  const stage = await db.pipelineStage.findUnique({
    where: { id: stageId },
    select: { kind: true },
  });
  // Rejection always goes through its own form, with a reason and a message.
  if (stage?.kind === "rejected")
    redirect(`/app/hire/candidats/${applicationId}?decision=refus#decision`);
  const moved = await guarded(
    () => moveApplication(db, ctx, applicationId, stageId),
    "/app/hire/offres",
  );
  if (moved) await onStageChanged(applicationId, moved.to).catch((error) => console.error(error));
  back(formData, applicationId, moved ? `ok=deplacee` : "");
}

const rejectSchema = z.object({
  reason: z.enum(rejectReasons),
  message: z.string().max(4000).default(""),
  send: z.enum(["now", "none"]).default("now"),
});

export async function rejectApplicationAction(formData: FormData) {
  const { user, ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const parsed = rejectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect(`/app/hire/candidats/${applicationId}?decision=refus&erreur=1#decision`);
  const message = parsed.data.send === "now" ? parsed.data.message.trim() : "";
  const moved = await guarded(
    () => rejectApplication(db, ctx, applicationId, { reason: parsed.data.reason, message }),
    "/app/hire/offres",
  );
  if (moved) {
    if (message) {
      const conversation = await ensureApplicationConversation(db, applicationId);
      await sendMessage(db, { userId: user.id, hire: ctx }, conversation.id, {
        body: message,
      }).catch(() => undefined);
    }
    await onStageChanged(applicationId, moved.to, message).catch((error) => console.error(error));
  }
  redirect(`/app/hire/candidats/${applicationId}?ok=decision`);
}

export async function addNoteAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "evaluate");
  const applicationId = id(formData.get("application"));
  const mentions = await guarded(
    () => addTeamNote(db, ctx, applicationId, String(formData.get("body") ?? "")),
    "/app/hire/offres",
  );
  redirect(`/app/hire/candidats/${applicationId}?ok=note&mentions=${mentions.length}#notes`);
}

const documentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(1000).default(""),
});

export async function requestDocumentAction(formData: FormData) {
  const { user, ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/app/hire/candidats/${applicationId}?erreur=document#document`);
  const application = await guarded(
    () =>
      db.application.findFirst({
        where: { id: applicationId, job: { organizationId: ctx.organizationId } },
      }),
    "/app/hire/offres",
  );
  if (!application) redirect("/app/hire/offres");
  const conversation = await ensureApplicationConversation(db, applicationId);
  const due = new Date(`${parsed.data.due}T23:59:59Z`);
  const sent = await sendMessage(db, { userId: user.id, hire: ctx }, conversation.id, {
    body: parsed.data.note || parsed.data.name,
    kind: "document_request",
    payload: { name: parsed.data.name, due: due.toISOString() },
  });
  await onMessageSent({
    ...sent,
    senderName: user.name,
    documentRequest: { name: parsed.data.name, due },
  }).catch((error) => console.error(error));
  redirect(`/app/hire/candidats/${applicationId}?ok=document`);
}
