"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { deliverDueDecisionMails, onStageChanged } from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import {
  ANALYSIS_EVENT,
  analyzeApplication,
  parseAnalysis,
  type AnalysisPoint,
} from "@/server/services/cv-analysis";
import { addTeamNote } from "@/server/services/evaluation";
import {
  getOrgApplication,
  HireError,
  moveApplication,
  rejectReasons,
} from "@/server/services/hire";
import {
  canShortlist,
  decide,
  decisionOutcomes,
  laterStage,
  undoDecision,
} from "@/server/services/hire-candidates";
import { SLOTS_MAX } from "@/server/services/interviews";
import { TEMPLATE_BODY_MAX } from "@/server/services/message-templates";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const fileOf = (applicationId: string) => `/app/hire/candidats/${applicationId}`;

async function guarded<T>(work: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HireError) redirect(fallback);
    throw error;
  }
}

/** Decision e-mails due leave once the answer is sent, without making anyone wait. */
const flushMails = () =>
  after(() => deliverDueDecisionMails().catch((error) => reportError(error)));

/**
 * « Déplacer » in « Changer d'étape » (planche `ETAPE`): one stage of the offer, or « Décision
 * finale », which opens the decision screen (the decision is never made by a move alone).
 */
export async function moveCandidateAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const stageId = id(formData.get("stage"));
  if (stageId === "decision") redirect(`${fileOf(applicationId)}/decision`);
  const application = await guarded(
    () => getOrgApplication(db, ctx, applicationId),
    "/app/hire/candidats",
  );
  const stage = application.job.stages.find((item) => item.id === stageId);
  // The outcomes go through the decision screen and its message.
  if (!stage || stage.kind === "hired" || stage.kind === "rejected")
    redirect(`${fileOf(applicationId)}/decision`);
  const moved = await guarded(
    () => moveApplication(db, ctx, applicationId, stage.id),
    `${fileOf(applicationId)}?erreur=etape`,
  );
  if (moved) await onStageChanged(applicationId, moved.to).catch((error) => reportError(error));
  flushMails();
  // From the file opened beside the list (web recruteur lot 2): back there, the file still open.
  if (formData.get("retour") === "liste")
    redirect(
      `/app/hire/candidats?${new URLSearchParams({ offre: application.jobId, id: applicationId, ok: "deplacee" })}`,
    );
  redirect(`${fileOf(applicationId)}?ok=deplacee`);
}

/** « Résumer avec Orbi »: one credit of the organization, then the analysis opens. */
export async function analyzeCandidateAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "readApplications");
  const applicationId = id(formData.get("application"));
  const result = await guarded(
    () => analyzeApplication(db, ctx, applicationId),
    "/app/hire/candidats",
  );
  if (!result.ok) redirect(`${fileOf(applicationId)}?orbi=${result.error}#orbi`);
  redirect(`${fileOf(applicationId)}?analyse=1#orbi`);
}

/** The analysis as plain sentences, for a note. */
async function analysisText(points: { strengths: AnalysisPoint[]; toVerify: AnalysisPoint[] }) {
  const t = await getTranslations("hireCandidates.analysis");
  const line = (item: AnalysisPoint) =>
    "text" in item ? item.text : t(`point.${item.key}`, item.values as never);
  return [
    t("strengths"),
    ...points.strengths.map((item) => `• ${line(item)}`),
    "",
    t("toVerify"),
    ...points.toVerify.map((item) => `• ${line(item)}`),
  ]
    .join("\n")
    .trim();
}

/** « Ajouter aux notes »: the member's own private note, which they can edit or delete. */
export async function analysisToNoteAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "evaluate");
  const applicationId = id(formData.get("application"));
  const application = await guarded(
    () => getOrgApplication(db, ctx, applicationId),
    "/app/hire/candidats",
  );
  const event = [...application.events].reverse().find((item) => item.type === ANALYSIS_EVENT);
  const analysis = parseAnalysis(event?.payload);
  if (!analysis) redirect(fileOf(applicationId));
  const body = await analysisText(analysis);
  await guarded(() => addTeamNote(db, ctx, applicationId, body), fileOf(applicationId));
  redirect(`${fileOf(applicationId)}?ok=note-orbi#notes`);
}

/** « Signaler une erreur »: kept in the audit log with the analysis it concerns. */
export async function reportAnalysisAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "readApplications");
  const applicationId = id(formData.get("application"));
  const application = await guarded(
    () => getOrgApplication(db, ctx, applicationId),
    "/app/hire/candidats",
  );
  const event = [...application.events].reverse().find((item) => item.type === ANALYSIS_EVENT);
  if (event)
    await db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "ai.cv_analysis.reported",
        targetType: "application",
        targetId: application.id,
        organizationId: ctx.organizationId,
        metadata: { eventId: event.id },
      },
    });
  redirect(`${fileOf(applicationId)}?ok=signale`);
}

const decisionSchema = z.object({
  application: z.string().min(1).max(60),
  outcome: z.enum(decisionOutcomes),
  message: z.string().max(TEMPLATE_BODY_MAX).default(""),
  reason: z
    .enum(rejectReasons)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  vivier: z.literal("on").optional(),
  pool: z.string().max(60).optional(),
});

/** « Confirmer et envoyer » (planche `DECIS`): the message was read; it leaves now. */
export async function decideAction(formData: FormData) {
  const { user, space, ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const page = `${fileOf(applicationId)}/decision`;
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${page}?erreur=1`);
  const input = parsed.data;
  // The talent always receives a message for a retained or not retained application.
  if (input.outcome !== "withdrawn" && input.message.trim().length < 2)
    redirect(`${page}?issue=${input.outcome}&erreur=message`);
  const poolId =
    input.vivier === "on" && input.pool && (await canShortlist(db, ctx)) ? input.pool : null;
  // Retained: the call to fix the arrival date, when the member chose its times (lot 4).
  const callSlots =
    input.outcome === "hired" && formData.get("appel") === "on"
      ? formData
          .getAll("slot")
          .map((value) => String(value).slice(0, 20))
          .filter(Boolean)
          .slice(0, SLOTS_MAX)
      : [];
  if (formData.get("appel") === "on" && input.outcome === "hired" && callSlots.length === 0)
    redirect(`${page}?issue=hired&appel=1&erreur=appel`);
  await guarded(
    () =>
      decide(db, ctx, applicationId, {
        outcome: input.outcome,
        message: input.message,
        reason: input.reason ?? null,
        poolId,
        company: space.organization.name,
        signer: user.name,
        call: callSlots.length
          ? { slots: callSlots, timezone: String(formData.get("timezone") ?? "").slice(0, 60) }
          : null,
      }),
    callSlots.length ? `${page}?issue=hired&appel=1&erreur=appel` : `${page}?erreur=1`,
  );
  flushMails();
  // From the file on the phone (Modèle B recruteur M5): back to the file, the decision told.
  if (formData.get("retour") === "fiche") redirect(`${fileOf(applicationId)}?ok=decision`);
  redirect(`${page}?enregistree=1`);
}

/** « Annuler » within 10 minutes of the decision. */
export async function undoDecisionAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const result = await guarded(
    () => undoDecision(db, ctx, applicationId),
    `${fileOf(applicationId)}/decision?enregistree=1&erreur=annulation`,
  );
  if (result === "expired")
    redirect(`${fileOf(applicationId)}/decision?enregistree=1&erreur=delai`);
  redirect(`${fileOf(applicationId)}?ok=annulee`);
}

/** « Plus tard »: the candidate waits in « Décision finale » when the offer has that stage. */
export async function laterDecisionAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const application = await guarded(
    () => getOrgApplication(db, ctx, applicationId),
    "/app/hire/candidats",
  );
  const stage = laterStage(application);
  if (!stage) redirect(fileOf(applicationId));
  const moved = await guarded(
    () => moveApplication(db, ctx, applicationId, stage.id),
    fileOf(applicationId),
  );
  if (moved) await onStageChanged(applicationId, moved.to).catch((error) => reportError(error));
  redirect(`${fileOf(applicationId)}?ok=plus-tard`);
}
