"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { onMessageSent } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { allowAttempt } from "@/server/rate-limit";
import {
  answerDocumentRequest,
  blockConversation,
  ConnectError,
  sendMessage,
} from "@/server/services/connect";
import { createReport } from "@/server/services/moderation";
import { markNotificationsRead } from "@/server/services/notifications";
import { mailContactAccepted, mailInterviewConfirmed } from "@/server/hire-emails";
import { answerInterview } from "@/server/services/interviews";
import { respondContactRequest } from "@/server/services/talent-search";
import { reportError } from "@/server/observability";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

export async function sendMessageAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const { user, viewer } = await connectViewer(`/app/messages/${conversationId}`);
  if (!(await allowAttempt("message", user.id))) {
    redirect(`/app/messages/${conversationId}?erreur=trop`);
  }
  try {
    const sent = await sendMessage(db, viewer, conversationId, {
      body: String(formData.get("body") ?? ""),
    });
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
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
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
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

// ─── Contact requests and interviews, talent side (E8) ───────────────────────────

export async function respondContactAction(formData: FormData) {
  const user = await requireUser("/app/messages?filtre=demandes");
  const raw = String(formData.get("answer"));
  const answer = raw === "accept" ? "accept" : raw === "block" ? "block" : "decline";
  const requestId = id(formData.get("request"));
  const result = await respondContactRequest(db, user.id, requestId, answer);
  if (result.status === "accepted") {
    const request = await db.contactRequest.findFirstOrThrow({
      where: { conversationId: result.conversationId },
      select: { requester: { select: { email: true, firstName: true } } },
    });
    await mailContactAccepted(request.requester, {
      candidateName: user.name,
      href: `/app/messages/${result.conversationId}`,
    });
    redirect(`/app/messages/${result.conversationId}?ok=relation`);
  }
  redirect(`/app/messages?filtre=demandes&reponse=${result.status}&demande=${requestId}`);
}

export async function answerInterviewAction(formData: FormData) {
  const conversationId = id(formData.get("conversation"));
  const user = await requireUser(`/app/messages/${conversationId}`);
  const interviewId = id(formData.get("interview"));
  const raw = String(formData.get("answer"));
  const message = String(formData.get("message") ?? "");
  try {
    await answerInterview(
      db,
      user.id,
      interviewId,
      raw === "accept"
        ? { answer: "accept", slot: String(formData.get("slot") ?? "") }
        : raw === "propose"
          ? {
              answer: "propose",
              slots: formData.getAll("slot").map((value) => String(value).slice(0, 20)),
              message,
            }
          : { answer: "decline", message },
    );
  } catch (error) {
    if ((error as Error).name !== "HireError") throw error;
    redirect(`/app/messages/${conversationId}?erreur=entretien#entretien-${interviewId}`);
  }
  if (raw === "accept") {
    const interview = await db.interview.findUniqueOrThrow({
      where: { id: interviewId },
      include: {
        organization: { select: { name: true } },
        application: { select: { job: { select: { title: true } } } },
      },
    });
    if (interview.startsAt)
      await mailInterviewConfirmed(user, {
        company: interview.organization.name,
        jobTitle: interview.application.job.title,
        date: interview.startsAt,
        timezone: interview.timezone,
        href: `/app/messages/${conversationId}`,
      });
  }
  refresh();
  redirect(`/app/messages/${conversationId}?ok=entretien#entretien-${interviewId}`);
}
