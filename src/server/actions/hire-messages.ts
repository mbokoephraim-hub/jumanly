"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { onMessageSent, onStageChanged } from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { ensureApplicationConversation, sendMessage } from "@/server/services/connect";
import {
  getOrgApplication,
  hireApplication,
  HireError,
  rejectApplication,
  rejectReasons,
} from "@/server/services/hire";
import {
  deleteTemplate,
  saveTemplate,
  TEMPLATE_BODY_MAX,
  templateSchema,
} from "@/server/services/message-templates";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

async function guarded<T>(work: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HireError) redirect(fallback);
    throw error;
  }
}

const decisionSchema = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("rejected"),
    reason: z.enum(rejectReasons),
    message: z.string().max(TEMPLATE_BODY_MAX).default(""),
    send: z.enum(["now", "none"]).default("now"),
  }),
  z.object({
    outcome: z.literal("hired"),
    message: z.string().trim().min(2).max(TEMPLATE_BODY_MAX),
  }),
]);

/**
 * « Envoyer » under the decision preview (prompt 5, screen 55): the decision is recorded and the
 * talent receives a DecisionCard, never a plain bubble. Nothing leaves before this click.
 */
export async function sendDecisionAction(formData: FormData) {
  const { user, ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  const page = `/app/hire/candidats/${applicationId}/message`;
  if (!parsed.success) {
    const model = formData.get("outcome") === "hired" ? "acceptation" : "refus";
    redirect(`${page}?modele=${model}&erreur=1`);
  }
  const input = parsed.data;
  const application = await guarded(
    () => getOrgApplication(db, ctx, applicationId),
    "/app/hire/offres",
  );
  const message =
    input.outcome === "hired" ? input.message : input.send === "now" ? input.message.trim() : "";
  const moved = await guarded(
    () =>
      input.outcome === "rejected"
        ? rejectApplication(db, ctx, applicationId, { reason: input.reason, message })
        : hireApplication(db, ctx, applicationId, { messageSent: true }),
    page,
  );
  if (moved) {
    if (message) {
      const conversation = await ensureApplicationConversation(db, applicationId);
      // The stage change already tells the talent (notification and e-mail).
      await sendMessage(db, { userId: user.id, hire: ctx }, conversation.id, {
        body: message,
        kind: "decision",
        payload: {
          outcome: input.outcome,
          company: application.job.organization.name,
          jobTitle: application.job.title,
          signer: user.name,
        },
      }).catch((error) => reportError(error));
    }
    await onStageChanged(applicationId, moved.to, message).catch((error) => reportError(error));
  }
  redirect(`/app/hire/candidats/${applicationId}?ok=decision`);
}

const textSchema = z.object({ body: z.string().trim().min(1).max(TEMPLATE_BODY_MAX) });

/** A convocation or a follow-up written from a template, sent as an ordinary message. */
export async function sendTemplateMessageAction(formData: FormData) {
  const { user, ctx } = await requireHire("/app/hire", "manage");
  const applicationId = id(formData.get("application"));
  const parsed = textSchema.safeParse(Object.fromEntries(formData));
  const model = String(formData.get("modele") ?? "relance").slice(0, 20);
  if (!parsed.success)
    redirect(`/app/hire/candidats/${applicationId}/message?modele=${model}&erreur=1`);
  await guarded(() => getOrgApplication(db, ctx, applicationId), "/app/hire/offres");
  const conversation = await ensureApplicationConversation(db, applicationId);
  const sent = await guarded(
    () =>
      sendMessage(db, { userId: user.id, hire: ctx }, conversation.id, {
        body: parsed.data.body,
      }),
    `/app/hire/candidats/${applicationId}/message?modele=${model}&erreur=1`,
  );
  await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
  redirect(`/app/messages/${conversation.id}#dernier`);
}

// ─── The organization's templates ───────────────────────────────────────────────

export async function saveTemplateAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/modeles", "manage");
  const templateId = id(formData.get("template"));
  const parsed = templateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect(`/app/hire/modeles?erreur=1${templateId ? `&modele=${templateId}` : ""}`);
  await guarded(
    () => saveTemplate(db, ctx, { ...parsed.data, id: templateId || undefined }),
    "/app/hire/modeles?erreur=1",
  );
  redirect("/app/hire/modeles?ok=enregistre");
}

export async function deleteTemplateAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/modeles", "manage");
  await guarded(
    () => deleteTemplate(db, ctx, id(formData.get("template"))),
    "/app/hire/modeles?erreur=1",
  );
  redirect("/app/hire/modeles?ok=supprime");
}
