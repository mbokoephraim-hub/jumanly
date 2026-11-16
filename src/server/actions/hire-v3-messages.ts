"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { onMessageSent } from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { allowAttempt } from "@/server/rate-limit";
import { ConnectError, sendMessage } from "@/server/services/connect";
import { HireError } from "@/server/services/hire";
import { sendTeamMessage } from "@/server/services/hire-phone-messages";

/**
 * « Envoyer » of Messages in the recruiter's web app v3 (lot 5). Order of CLAUDE.md: validate →
 * session → role → limit → service (which reads through the organization, golden rule n° 6).
 */
const PAGE = "/app/messages";
const idOf = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "");
  return /^[\w-]{1,60}$/.test(text) ? text : "";
};
const tabOf = (value: FormDataEntryValue | null) =>
  value === "candidats" || value === "equipe" ? `&onglet=${value}` : "";

export async function hv3SendCandidateAction(formData: FormData) {
  const id = idOf(formData.get("conversation"));
  const back = `${PAGE}?c=${id}${tabOf(formData.get("tab"))}`;
  const { user, ctx } = await requireHire(back, "manage");
  if (!(await allowAttempt("message", user.id))) redirect(`${back}&erreur=trop`);
  try {
    const sent = await sendMessage(db, { userId: user.id, hire: ctx }, id, {
      body: String(formData.get("body") ?? ""),
    });
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
  } catch (error) {
    if (!(error instanceof ConnectError)) throw error;
    redirect(`${back}&erreur=${error.code === "blocked" ? "blocked" : "invalid"}`);
  }
  refresh();
  redirect(`${back}#dernier`);
}

export async function hv3SendTeamAction(formData: FormData) {
  const id = idOf(formData.get("thread"));
  const back = `${PAGE}?equipe=${id}${tabOf(formData.get("tab"))}`;
  const { user, ctx } = await requireHire(back);
  if (!(await allowAttempt("message", user.id))) redirect(`${back}&erreur=trop`);
  try {
    await sendTeamMessage(db, ctx, id, String(formData.get("body") ?? ""), user.name);
  } catch (error) {
    if (!(error instanceof HireError)) throw error;
    redirect(`${back}&erreur=invalid`);
  }
  refresh();
  redirect(`${back}#dernier`);
}
