"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { onMessageSent } from "@/server/application-events";
import { db } from "@/server/db";
import { isPhone } from "@/server/view";
import { requireHire, setActiveSpace } from "@/server/hire-context";
import { requireUser } from "@/server/auth/session";
import { ensureApplicationConversation, sendMessage } from "@/server/services/connect";
import { addTeamNote } from "@/server/services/evaluation";
import { closeJob, deleteDraft, duplicateJob, HireError, publishJob } from "@/server/services/hire";
import { setupAccount } from "@/server/services/accounts";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { reportError } from "@/server/observability";
import { writeJob, type JobWriterInput, type JobWriterResult } from "@/server/services/job-writer";

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

/**
 * « Passer en compte recruteur » (Ephraïm, 22/10/2026), from the talent's settings. A person who
 * already works in a recruiter space goes there; anyone else gets their own organization, still
 * to be named, and the recruiter's first steps (/app/bienvenue: who they recruit for, the
 * organization, or joining an existing one). The talent profile stays, one tap away.
 */
export async function becomeRecruiterAction() {
  const user = await requireUser("/app/parametres");
  const memberships = await hireMemberships(db, user.id);
  const usable = memberships.find((membership) => !membership.organization.suspendedAt);
  if (usable) {
    await setActiveSpace(usable.organizationId);
    redirect("/app/hire");
  }
  if (memberships.length > 0) redirect("/app/acces-refuse?raison=organisation");
  // On a phone, the recruiter's profile of Modèle B (M2) names the company at its step 5.
  const org = await setupAccount(db, user.id, { profile: "rh", phone: await isPhone() });
  if (org) await setActiveSpace(org.id);
  redirect("/app/bienvenue");
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

// ─── Candidate file ───────────────────────────────────────────────────────────

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
  // From a conversation (planche recruteur-3 `CONV_R`, « + ») the answer comes back there.
  const fromConversation = formData.get("retour") === "conversation";
  const back = (conversationId: string, query: string) =>
    fromConversation
      ? `/app/messages/${conversationId}?${query}#dernier`
      : `/app/hire/candidats/${applicationId}?${query}${query.startsWith("erreur") ? "#document" : ""}`;
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(back(id(formData.get("conversation")), "erreur=document"));
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
  redirect(back(conversation.id, "ok=document"));
}

// ─── Help to write a job (lot 11) ─────────────────────────────────────────────

/** « Rédiger une première version » and « Améliorer la clarté avec l'IA » on the job form. */
export async function jobWriterAction(input: JobWriterInput): Promise<JobWriterResult> {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  return writeJob(db, ctx, input);
}
