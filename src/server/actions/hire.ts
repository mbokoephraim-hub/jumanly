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
  duplicateJob,
  HireError,
  moveApplication,
  publishJob,
} from "@/server/services/hire";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { reportError } from "@/server/observability";
import { writeJob, type JobWriterInput, type JobWriterResult } from "@/server/services/job-writer";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

const decisionHref = (applicationId: string, kind: "rejected" | "hired") =>
  `/app/hire/candidats/${applicationId}/message?modele=${kind === "rejected" ? "refus" : "acceptation"}`;

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
  const [memberships, partners] = await Promise.all([
    hireMemberships(db, user.id),
    partnerMemberships(db, user.id),
  ]);
  if (partners.some((membership) => membership.organizationId === wanted)) {
    await setActiveSpace(wanted);
    redirect("/app/partenaire");
  }
  if (!memberships.some((membership) => membership.organizationId === wanted)) redirect("/app");
  await setActiveSpace(wanted);
  const suite = String(formData.get("suite") ?? "");
  redirect(suite.startsWith("/app/") && !suite.startsWith("//") ? suite : "/app/hire");
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function closeJobAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const jobId = id(formData.get("id"));
  await guarded(() => closeJob(db, ctx, jobId), "/app/hire/offres");
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { slug: true } });
  refreshPublicJobs(job.slug);
  redirect("/app/hire/offres?onglet=cloturees&ok=fermee");
}

/** « Rouvrir » a closed job: published again within the active-job limit. */
export async function reopenJobAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const jobId = id(formData.get("id"));
  const result = await guarded(() => publishJob(db, ctx, jobId), "/app/hire/offres");
  if (result.status === "limit") redirect("/app/hire/offres?onglet=cloturees&erreur=limite");
  if (result.status === "incomplete") redirect(`/app/hire/offres/${jobId}/modifier?etape=2`);
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { slug: true } });
  refreshPublicJobs(job.slug);
  redirect(
    `/app/hire/offres/${jobId}?publiee=${result.status === "published" ? "1" : "verification"}`,
  );
}

export async function duplicateJobAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const copy = await guarded(
    () => duplicateJob(db, ctx, id(formData.get("id"))),
    "/app/hire/offres",
  );
  redirect(`/app/hire/offres/${copy}/modifier?ok=copie`);
}

export async function deleteDraftAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  await guarded(() => deleteDraft(db, ctx, id(formData.get("id"))), "/app/hire/offres");
  redirect("/app/hire/offres?onglet=brouillons&ok=supprimee");
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/** Where to come back after an action on a candidate: the pipeline or the application page. */
function back(formData: FormData, applicationId: string, params = "") {
  const from = String(formData.get("back") ?? "");
  if (!from.startsWith("/app/hire/") || from.startsWith("//")) {
    const base = `/app/hire/candidats/${applicationId}`;
    redirect(params ? `${base}?${params}` : base);
  }
  // The candidates of an offer keep their `offre` (`/app/hire/candidats?offre=`), nothing else.
  const [path, search = ""] = from.split("#")[0]!.split("?");
  const offer = new URLSearchParams(search).get("offre");
  const next = new URLSearchParams(offer ? { offre: offer.slice(0, 60) } : {});
  for (const [key, value] of new URLSearchParams(params)) next.set(key, value);
  const text = next.toString();
  redirect(text ? `${path}?${text}` : path!);
}

export async function moveApplicationAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const stageId = id(formData.get("stage"));
  const stage = await db.pipelineStage.findUnique({
    where: { id: stageId },
    select: { kind: true },
  });
  // A decision always goes through its preview (prompt 5): the message leaves only on a click.
  if (stage?.kind === "rejected" || stage?.kind === "hired")
    redirect(decisionHref(applicationId, stage.kind));
  const moved = await guarded(
    () => moveApplication(db, ctx, applicationId, stageId),
    "/app/hire/offres",
  );
  if (moved) await onStageChanged(applicationId, moved.to).catch((error) => reportError(error));
  back(formData, applicationId, moved ? `ok=deplacee` : "");
}

export type MoveCardResult =
  | { status: "moved"; stage: string }
  | { status: "unchanged" }
  | { status: "decision"; href: string }
  | { status: "error" };

/**
 * Drag and drop in the pipeline (mockup 04-04): the same move as `moveApplicationAction`, answered
 * without a redirect so the card stays where it was dropped. « Non retenu » and « Embauché » open
 * the decision preview: a decision is never made by a drop alone.
 */
export async function moveCardAction(input: {
  applicationId: string;
  stageId: string;
}): Promise<MoveCardResult> {
  const { ctx } = await requireHire("/app/hire", "manage");
  const applicationId = String(input.applicationId).slice(0, 60);
  const stageId = String(input.stageId).slice(0, 60);
  const stage = await db.pipelineStage.findUnique({
    where: { id: stageId },
    select: { kind: true },
  });
  if (stage?.kind === "rejected" || stage?.kind === "hired")
    return { status: "decision", href: decisionHref(applicationId, stage.kind) };
  try {
    const moved = await moveApplication(db, ctx, applicationId, stageId);
    if (!moved) return { status: "unchanged" };
    await onStageChanged(applicationId, moved.to).catch((error) => reportError(error));
    return { status: "moved", stage: moved.to.name };
  } catch (error) {
    if (error instanceof HireError) return { status: "error" };
    throw error;
  }
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
  }).catch((error) => reportError(error));
  redirect(`/app/hire/candidats/${applicationId}?ok=document`);
}

// ─── Help to write a job (lot 11) ─────────────────────────────────────────────

/** « Rédiger une première version » and « Améliorer la clarté avec l'IA » on the job form. */
export async function jobWriterAction(input: JobWriterInput): Promise<JobWriterResult> {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  return writeJob(db, ctx, input);
}
