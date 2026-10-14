"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { onMessageSent } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import {
  answerDocumentRequest,
  blockConversation,
  ConnectError,
  sendMessage,
} from "@/server/services/connect";
import { createReport } from "@/server/services/moderation";
import { markNotificationsRead } from "@/server/services/notifications";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

export async function sendMessageAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const { user, viewer } = await connectViewer(`/app/messages/${conversationId}`);
  try {
    const sent = await sendMessage(db, viewer, conversationId, {
      body: String(formData.get("body") ?? ""),
    });
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => console.error(error));
  } catch (error) {
    if (!(error instanceof ConnectError)) throw error;
    redirect(`/app/messages/${conversationId}?erreur=${error.code}`);
  }
  // Same address as the thread: the page is refreshed so the new message shows.
  refresh();
  redirect(`/app/messages/${conversationId}#dernier`);
}

export async function answerDocumentAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const { user, viewer } = await connectViewer(`/app/messages/${conversationId}`);
  try {
    const sent = await answerDocumentRequest(
      db,
      viewer,
      conversationId,
      id(formData.get("request")),
      id(formData.get("document")),
    );
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => console.error(error));
  } catch (error) {
    if (!(error instanceof ConnectError)) throw error;
    redirect(`/app/messages/${conversationId}?erreur=${error.code}`);
  }
  redirect(`/app/messages/${conversationId}?ok=document#dernier`);
}

export async function blockAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const { viewer } = await connectViewer(`/app/messages/${conversationId}`);
  await blockConversation(db, viewer, conversationId, formData.get("block") === "1").catch(
    () => undefined,
  );
  redirect(
    `/app/messages/${conversationId}?ok=${formData.get("block") === "1" ? "bloque" : "debloque"}`,
  );
}

/** « Signaler »: a job, a message or a conversation. The back path is checked. */
export async function reportAction(formData: FormData) {
  const user = await requireUser("/app");
  const backPath = String(formData.get("back") ?? "/app");
  const safe = backPath.startsWith("/app/") && !backPath.startsWith("//");
  const base = safe ? backPath.split(/[?#]/)[0]! : "/app";
  const anchor =
    safe && /^[\w-]+$/.test(backPath.split("#")[1] ?? "") ? `#${backPath.split("#")[1]}` : "";
  const result = await createReport(db, user.id, Object.fromEntries(formData));
  redirect(
    `${base}?signalement=${result === "created" ? "ok" : result === "already" ? "deja" : "erreur"}${anchor}`,
  );
}

export async function markNotificationsReadAction(formData: FormData) {
  const user = await requireUser("/app/notifications");
  const notification = id(formData.get("id")) || undefined;
  await markNotificationsRead(db, user.id, notification);
  const href = String(formData.get("href") ?? "");
  if (!notification) redirect("/app/notifications?ok=lues");
  redirect(href.startsWith("/app") && !href.startsWith("//") ? href : "/app/notifications");
}
