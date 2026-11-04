"use server";

import { RedirectType, redirect } from "next/navigation";

/**
 * Every answer on a candidate's file replaces the page in the history (Ephraïm, 03/11/2026): « Retour »
 * then goes straight back to the list, never through each state the file went through.
 */
function go(url: string): never {
  redirect(url, RedirectType.replace);
}
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import {
  ConnectError,
  ensureApplicationConversation,
  sendMessage,
} from "@/server/services/connect";
import { getOrgApplication, HireError } from "@/server/services/hire";
import { holdAfterRequest } from "@/server/services/hire-tri";

const askSchema = z.object({
  application: z.string().min(1).max(60),
  job: z.string().min(1).max(60),
  body: z.string().trim().min(10).max(2000),
  back: z.string().max(400),
});

/**
 * « Propositions » of a candidate's file on the phone (Ephraïm, 03/11/2026): one prepared message
 * (« vos expériences ne sont pas vérifiées », « vos diplômes »…) sent to the candidate in
 * Messages, edited by the recruiter before sending. Order of CLAUDE.md: validate → session → role
 * → service. A person still « À trier » is then set aside « En attente », so the file moves to
 * « À compléter » (04/11/2026); nobody is declined (golden rule n° 3).
 */
export async function askCandidateAction(formData: FormData) {
  const parsed = askSchema.safeParse({
    application: formData.get("application"),
    job: formData.get("job"),
    body: formData.get("body"),
    back: formData.get("back"),
  });
  const fallback = `/app/hire/offres/${String(formData.get("job") ?? "").slice(0, 60)}`;
  const back =
    parsed.success && parsed.data.back.startsWith("/app/hire/offres/")
      ? parsed.data.back
      : fallback;
  const withParam = (param: string) => `${back}${back.includes("?") ? "&" : "?"}${param}`;
  if (!parsed.success) go(withParam("demande=vide"));
  const { ctx } = await requireHire(back, "manage");
  try {
    const application = await getOrgApplication(db, ctx, parsed.data.application);
    if (application.jobId !== parsed.data.job) throw new HireError("notFound");
    const conversation =
      application.conversation ?? (await ensureApplicationConversation(db, application.id));
    await sendMessage(db, { userId: ctx.userId, hire: ctx }, conversation.id, {
      body: parsed.data.body,
    });
    if (application.status === "active") await holdAfterRequest(db, ctx, application.id);
  } catch (error) {
    if (error instanceof HireError || error instanceof ConnectError)
      go(withParam("demande=erreur"));
    throw error;
  }
  go(withParam("demande=envoyee"));
}
