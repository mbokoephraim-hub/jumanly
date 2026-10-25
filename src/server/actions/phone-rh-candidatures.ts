"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  deliverDueDecisionMails,
  onMessageSent,
  onStageChanged,
} from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { HireError, jobScope } from "@/server/services/hire";
import { sendGroupReply, GROUP_MAX } from "@/server/services/hire-group-replies";
import {
  assignApplication,
  PROPOSAL_SALARY_MAX,
  RH_GROUP_TEMPLATES,
  sendProposal,
} from "@/server/services/hire-phone-candidatures";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const fileOf = (applicationId: string) => `/app/hire/candidats/${applicationId}`;

const flushMails = () =>
  after(() => deliverDueDecisionMails().catch((error) => reportError(error)));

/** « Confier … à » (planche Recruteur-candidat-repartir): the member chosen follows the file. */
export async function rhAssignAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/candidats", "manage");
  const applicationId = id(formData.get("application"));
  try {
    await assignApplication(db, ctx, applicationId, id(formData.get("member")));
  } catch (error) {
    if (error instanceof HireError) redirect(`${fileOf(applicationId)}?erreur=confie`);
    throw error;
  }
  redirect(`${fileOf(applicationId)}?ok=confie`);
}

const proposalSchema = z.object({
  application: z.string().min(1).max(60),
  salary: z
    .string()
    .trim()
    .regex(/^\d{0,7}$/)
    .transform((value) => (value ? Number(value) : null))
    .refine((value) => value === null || (value > 0 && value <= PROPOSAL_SALARY_MAX)),
  start: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/)
    .transform((value) => (value ? new Date(`${value}T00:00:00Z`) : null)),
  message: z.string().trim().min(10).max(4000),
});

/**
 * « Envoyer la proposition » (planche Recruteur-proposition): the message, then the salary and the
 * start date, in the conversation; the person answers from Messages.
 */
export async function rhProposalAction(formData: FormData) {
  const { user, ctx } = await requireHire("/app/hire/candidats", "manage");
  const applicationId = id(formData.get("application"));
  const page = `${fileOf(applicationId)}/decision?issue=proposition`;
  const parsed = proposalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${page}&erreur=1`);
  const { salary, start, message } = parsed.data;
  const t = await getTranslations("phoneRhCandidatures.proposal");
  const format = await getFormatter();
  const details = [
    salary === null
      ? null
      : t("salaryLine", {
          amount: format.number(salary, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }),
        }),
    start === null
      ? null
      : t("startLine", { date: format.dateTime(start, { dateStyle: "long", timeZone: "UTC" }) }),
  ].filter(Boolean);
  const body = details.length ? `${message}\n\n${details.join("\n")}` : message;
  let result: Awaited<ReturnType<typeof sendProposal>>;
  try {
    result = await sendProposal(db, ctx, applicationId, { body, salary, start });
  } catch (error) {
    if (error instanceof HireError) redirect(`${page}&erreur=1`);
    throw error;
  }
  await onMessageSent({ ...result.sent, senderName: user.name }).catch((error) =>
    reportError(error),
  );
  if (result.moved)
    await onStageChanged(applicationId, result.moved.to).catch((error) => reportError(error));
  flushMails();
  redirect(`${fileOf(applicationId)}?ok=proposition`);
}

/**
 * « Envoyer à chacun » (planche Recruteur-cand-groupe): the template, with each person's first
 * name, to each person chosen; « Réponse non retenue » is the member's decision with its message.
 * One sending per offer, as on the computer (undone the same way, e-mails after 10 minutes).
 */
export async function rhGroupAction(formData: FormData) {
  const { user, space, ctx } = await requireHire("/app/hire/candidats", "manage");
  const back = String(formData.get("back") ?? "/app/hire/candidats");
  const page = back.startsWith("/app/hire/candidats") ? back : "/app/hire/candidats";
  const template = RH_GROUP_TEMPLATES.find((value) => value === formData.get("template"));
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, GROUP_MAX);
  const body = String(formData.get("body") ?? "");
  const join = page.includes("?") ? "&" : "?";
  if (!template || ids.length === 0) redirect(`${page}${join}erreur=groupe`);
  const applications = await db.application.findMany({
    where: { id: { in: ids }, job: await jobScope(db, ctx) },
    select: { id: true, jobId: true },
  });
  const byJob = new Map<string, string[]>();
  for (const application of applications)
    byJob.set(application.jobId, [...(byJob.get(application.jobId) ?? []), application.id]);
  const t = await getTranslations("hireReplies.strength");
  let count = 0;
  for (const [jobId, jobIds] of byJob) {
    const result = await sendGroupReply(db, ctx, jobId, {
      group: "selection",
      ids: jobIds,
      body,
      email: true,
      reviewed: true,
      reject: template === "nonretenu",
      strengthText: (strength) =>
        strength.key === "generic" ? t("generic") : t(strength.key, { skill: strength.skill }),
      company: space.organization.name,
      signer: user.name,
    }).catch((error) => {
      if (error instanceof HireError) return null;
      throw error;
    });
    if (result?.ok) count += result.count;
  }
  flushMails();
  redirect(`${page}${join}${count > 0 ? `ok=groupe&n=${count}` : "erreur=groupe"}`);
}
