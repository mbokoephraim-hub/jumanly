"use server";

import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import {
  conversationAction,
  conversationActions,
  hideConversations,
  type ConversationAction,
} from "@/server/services/hire-messaging";

/**
 * The menu of a recruiter's conversation and Orbi's clean-up (recruteur lot 6). Order of
 * CLAUDE.md: validate → session → role → service (each service reads through the organization).
 */

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

/** Épingler, couper les notifications, retirer de ma messagerie. */
export async function conversationMenuAction(formData: FormData) {
  const { ctx } = await requireHire("/app/messages", "readApplications");
  const conversationId = id(formData.get("conversation"));
  const value = String(formData.get("action") ?? "");
  const action = conversationActions.find((item) => item === value) as
    ConversationAction | undefined;
  if (!action) redirect(`/app/messages/${conversationId}`);
  try {
    await conversationAction(db, ctx, conversationId, action);
  } catch (error) {
    if (error instanceof HireError) redirect("/app/messages");
    throw error;
  }
  if (action === "hide") redirect("/app/messages?ok=retiree");
  redirect(`/app/messages/${conversationId}?ok=${action}#dernier`);
}

/** « Retirer » the conversations ticked in Orbi's clean-up (planche NETT). */
export async function cleanupConversationsAction(formData: FormData) {
  const { ctx } = await requireHire("/app/messages", "manage");
  const ids = formData.getAll("ids").map(id).filter(Boolean);
  const count = await hideConversations(db, ctx, ids);
  redirect(`/app/messages?ok=nettoyage&n=${count}`);
}
