"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { onMessageSent } from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { allowAttempt } from "@/server/rate-limit";
import { ConnectError, sendMessage, type Viewer } from "@/server/services/connect";
import { HireError } from "@/server/services/hire";
import { conversationAction } from "@/server/services/hire-messaging";
import { openTeamThread, sendTeamMessage } from "@/server/services/hire-phone-messages";
import { MediaError, storeUpload } from "@/server/services/message-media";

/**
 * The gestures of the recruiter's Messages on the phone (Modèle B recruteur M7). Order of
 * CLAUDE.md: validate → session → role → limit → service. A conversation about an application is
 * written as the organization; a relation of the member, as the person.
 */
const id = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "");
  return /^[\w-]{1,60}$/.test(text) ? text : "";
};
const PAGE = "/app/messages";

/** The viewer that may write in this conversation: the organization, or the person. */
async function viewerFor(conversationId: string) {
  const { user, ctx } = await requireHire(`${PAGE}/${conversationId}`);
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { organizationId: ctx.organizationId, kind: { not: "peer" } },
        { kind: "peer", participants: { some: { userId: user.id } } },
      ],
    },
    select: { kind: true },
  });
  if (!conversation) redirect(PAGE);
  const viewer: Viewer =
    conversation.kind === "peer" ? { userId: user.id } : { userId: user.id, hire: ctx };
  return { user, ctx, viewer, peer: conversation.kind === "peer" };
}

/** « Envoyer » of a conversation (planches 125 to 131). */
export async function rhSendAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const back = `${PAGE}/${conversationId}`;
  const { user, viewer } = await viewerFor(conversationId);
  if (!(await allowAttempt("message", user.id))) redirect(`${back}?erreur=trop`);
  try {
    const sent = await sendMessage(db, viewer, conversationId, {
      body: String(formData.get("body") ?? ""),
    });
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
  } catch (error) {
    if (!(error instanceof ConnectError)) throw error;
    redirect(`${back}?erreur=${error.code === "blocked" ? "blocked" : "invalid"}`);
  }
  refresh();
  redirect(`${back}#dernier`);
}

/** « Joindre › Un fichier » (planche 128): a PDF or an image, kept privately. */
export async function rhUploadAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const back = `${PAGE}/${conversationId}`;
  const { user, viewer } = await viewerFor(conversationId);
  if (!(await allowAttempt("message", user.id))) redirect(`${back}?erreur=trop`);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(`${back}?erreur=file`);
  try {
    const upload = await storeUpload(
      db,
      conversationId,
      new Uint8Array(await file.arrayBuffer()),
      file.name,
    );
    const sent = await sendMessage(db, viewer, conversationId, {
      body: upload.name,
      kind: "file",
      payload: { upload },
    });
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
  } catch (error) {
    if (error instanceof MediaError) redirect(`${back}?erreur=file`);
    if (error instanceof ConnectError)
      redirect(`${back}?erreur=${error.code === "blocked" ? "blocked" : "invalid"}`);
    throw error;
  }
  refresh();
  redirect(`${back}?ok=file#dernier`);
}

/** « Couper les notifications » of the conversation, for this member only. */
export async function rhMuteAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  // The conversation is the member's to read (checked by `viewerFor`); the mute is theirs only.
  const { user } = await viewerFor(conversationId);
  const on = formData.get("on") === "1";
  await db.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    update: { mutedAt: on ? new Date() : null },
    create: { conversationId, userId: user.id, mutedAt: on ? new Date() : null },
  });
  refresh();
  redirect(`${PAGE}/${conversationId}?ok=${on ? "mute" : "unmute"}`);
}

/** « Épingler pour l'équipe » and « Retirer de ma messagerie » (nothing is deleted). */
export async function rhConversationAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const raw = String(formData.get("action") ?? "");
  const action = raw === "pin" || raw === "unpin" || raw === "hide" ? raw : null;
  const { ctx } = await requireHire(`${PAGE}/${conversationId}`);
  if (!action) redirect(`${PAGE}/${conversationId}`);
  try {
    await conversationAction(db, ctx, conversationId, action);
  } catch (error) {
    if (!(error instanceof HireError)) throw error;
    redirect(`${PAGE}/${conversationId}?erreur=other`);
  }
  refresh();
  redirect(action === "hide" ? `${PAGE}?ok=hide` : `${PAGE}/${conversationId}?ok=${action}`);
}

/** « Nouveau message » to a colleague (planche 124): the team's conversation opens. */
export async function rhOpenTeamAction(formData: FormData) {
  const { ctx } = await requireHire(PAGE);
  let threadId: string;
  try {
    threadId = await openTeamThread(db, ctx, id(formData.get("member")));
  } catch (error) {
    if (error instanceof HireError) redirect(`${PAGE}?onglet=equipe`);
    throw error;
  }
  redirect(`${PAGE}/equipe/${threadId}`);
}

/** « Envoyer » in a conversation with a colleague (planches 132, 133). */
export async function rhSendTeamAction(formData: FormData) {
  const threadId = id(formData.get("thread"));
  const back = `${PAGE}/equipe/${threadId}`;
  const { user, ctx } = await requireHire(back);
  if (!(await allowAttempt("message", user.id))) redirect(`${back}?erreur=trop`);
  try {
    await sendTeamMessage(db, ctx, threadId, String(formData.get("body") ?? ""), user.name);
  } catch (error) {
    if (!(error instanceof HireError)) throw error;
    redirect(error.code === "invalid" ? `${back}?erreur=invalid` : `${PAGE}?onglet=equipe`);
  }
  refresh();
  redirect(`${back}#dernier`);
}
