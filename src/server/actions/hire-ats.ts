"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { deliverDueDecisionMails } from "@/server/application-events";
import { mailCompanyNotice } from "@/server/company-notice-email";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { informRetained } from "@/server/services/company-notice";
import { analyzeApplication } from "@/server/services/cv-analysis";
import { HireError } from "@/server/services/hire";
import {
  cancelScheduledAts,
  runAts,
  scheduleAts,
  shortlist,
  startAts,
  stopAts,
  unshortlist,
} from "@/server/services/hire-ats";
import {
  replyGroups,
  sendGroupReply,
  undoGroupReply,
  type ReplyGroup,
} from "@/server/services/hire-group-replies";

/**
 * ATS with Orbi (recruteur lot 6). Order of CLAUDE.md: validate → session → role → right and
 * credits (`startAts` → `analysisReadiness`, then `runAi` for each file) → service. Nothing here
 * answers, moves or rejects a candidate.
 */

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

/** E-mails whose 10 minutes are over leave once the answer is sent. */
const flushMails = () =>
  after(() => deliverDueDecisionMails().catch((error) => reportError(error)));
const atsOf = (jobId: string) => `/app/hire/offres/${jobId}/ats`;

async function guarded<T>(work: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HireError) redirect(fallback);
    throw error;
  }
}

/**
 * « Lancer l'analyse » (planche 1 bis `ATS_QUAND`): now, on the applications received so far, or
 * once at the closing date. Launched now, the files are read after the answer; the page follows.
 */
export async function launchAtsAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "readApplications");
  const jobId = id(formData.get("job"));
  const when = formData.get("when") === "fin" ? "fin" : "maintenant";
  const autoAdd = formData.get("autoAdd") === "on";
  if (when === "fin") {
    await guarded(() => scheduleAts(db, ctx, jobId, { autoAdd }), `${atsOf(jobId)}?erreur=date`);
    redirect(`${atsOf(jobId)}?ok=programmee`);
  }
  const started = await guarded(() => startAts(db, ctx, jobId, { autoAdd }), "/app/hire/offres");
  if (!started.ok) redirect(`${atsOf(jobId)}?erreur=${started.error}`);
  after(() =>
    runAts(db, ctx, jobId).catch((error) =>
      reportError(error, { message: "Analyse ATS d'une offre" }),
    ),
  );
  redirect(atsOf(jobId));
}

/** « Arrêter l'analyse »: the files already read stay analysed. */
export async function stopAtsAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "readApplications");
  const jobId = id(formData.get("job"));
  await guarded(() => stopAts(db, ctx, jobId), "/app/hire/offres");
  redirect(`${atsOf(jobId)}?ok=arretee`);
}

/** « Annuler » the analysis planned for the closing date. */
export async function cancelAtsAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "readApplications");
  const jobId = id(formData.get("job"));
  await guarded(() => cancelScheduledAts(db, ctx, jobId), "/app/hire/offres");
  redirect(`${atsOf(jobId)}?ok=annulee`);
}

/** « Retenir » (planche `ATS_SEL`) and « Ajouter aux retenus » (planche `ATS4`). */
export async function shortlistAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage", "sort");
  const jobId = id(formData.get("job"));
  const ids = formData.getAll("ids").map(id).filter(Boolean);
  const back = String(formData.get("back") ?? "");
  const count = await guarded(() => shortlist(db, ctx, jobId, ids), "/app/hire/offres");
  if (back.startsWith(`${atsOf(jobId)}/`)) redirect(`${back}?ok=retenue`);
  redirect(`/app/hire/offres/${jobId}/retenus?ajout=${count}`);
}

/**
 * « Prévenir » (Ephraïm 30/10/2026): in one click, the retained not told yet (all of the offer, or
 * the one of the file) get the company's « Candidature retenue », as a message and by e-mail.
 */
export async function informRetainedAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage", "sort");
  const jobId = id(formData.get("job"));
  const ids = formData.getAll("ids").map(id).filter(Boolean);
  const back = String(formData.get("back") ?? "");
  const sent = await guarded(
    () => informRetained(db, ctx, jobId, ids.length > 0 ? ids : undefined),
    "/app/hire/offres",
  );
  await Promise.all(sent.map((notice) => mailCompanyNotice("retained", notice)));
  if (back.startsWith(`${atsOf(jobId)}/`)) redirect(`${back}?ok=prevenue`);
  redirect(`/app/hire/offres/${jobId}/retenus?prevenus=${sent.length}`);
}

/** « Retirer de la liste » in the list of the retained. */
export async function unshortlistAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage", "sort");
  const jobId = id(formData.get("job"));
  const applicationId = id(formData.get("application"));
  await guarded(() => unshortlist(db, ctx, jobId, applicationId), "/app/hire/offres");
  redirect(`/app/hire/offres/${jobId}/retenus?ok=retiree`);
}

/** « Résumer avec Orbi » from the profile for this offer: one credit, then back to it. */
export async function analyzeForOfferAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "readApplications");
  const jobId = id(formData.get("job"));
  const applicationId = id(formData.get("application"));
  const back = `${atsOf(jobId)}/${applicationId}`;
  const result = await guarded(() => analyzeApplication(db, ctx, applicationId), atsOf(jobId));
  redirect(result.ok ? `${back}?ok=analyse` : `${back}?orbi=${result.error}`);
}

const replyGroupOf = (value: FormDataEntryValue | null): ReplyGroup =>
  replyGroups.find((group) => group === value) ?? "retenus";

/**
 * « Envoyer à N » (planches `ENV`, `ENV_OK`): only once « J'ai relu » is ticked and the number
 * confirmed. The retained get the invitation, the others the member's decision with its message.
 */
export async function sendGroupReplyAction(formData: FormData) {
  const { ctx, space, user } = await requireHire("/app/hire/offres", "manage", "sort");
  const jobId = id(formData.get("job"));
  const group = replyGroupOf(formData.get("groupe"));
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim().slice(0, 60))
    .filter(Boolean);
  const back = `/app/hire/offres/${jobId}/reponses?groupe=${group}${ids.length ? `&ids=${ids.join(",")}` : ""}`;
  const t = await getTranslations("hireReplies.strength");
  const result = await guarded(
    () =>
      sendGroupReply(db, ctx, jobId, {
        group,
        ids,
        body: String(formData.get("body") ?? ""),
        email: formData.get("email") === "on",
        reviewed: formData.get("relu") === "on" && formData.get("confirme") === "on",
        strengthText: (strength) =>
          strength.key === "generic" ? t("generic") : t(strength.key, { skill: strength.skill }),
        company: space.organization.name,
        signer: user.name,
      }),
    "/app/hire/offres",
  );
  if (!result.ok) redirect(`${back}&erreur=${result.error}`);
  flushMails();
  redirect(`/app/hire/offres/${jobId}/reponses?groupe=${group}&envoye=${result.batchId}`);
}

/** « Annuler » under « Réponses envoyées », within 10 minutes. */
export async function undoGroupReplyAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage", "sort");
  const jobId = id(formData.get("job"));
  const batchId = id(formData.get("batch"));
  const group = replyGroupOf(formData.get("groupe"));
  const done = await guarded(() => undoGroupReply(db, ctx, jobId, batchId), "/app/hire/offres");
  redirect(
    `/app/hire/offres/${jobId}/reponses?groupe=${group}&envoye=${batchId}&annule=${done === "undone" ? "1" : "0"}`,
  );
}
