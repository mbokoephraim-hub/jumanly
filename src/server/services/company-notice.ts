/**
 * The company's letters to a candidate (Ephraïm 30/10/2026), posted in the conversation of the
 * application in the company's name, then sent by e-mail (src/server/company-notice-email.tsx):
 * - « Candidature reçue »: by itself, as soon as the application arrives, without any click;
 * - « Candidature retenue »: when a member clicks « Prévenir » for the people kept in the list of
 *   the retained (one, or all those not told yet).
 * Each letter is written once per application, in its history (`acknowledged`, `retained_informed`).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { t } from "../../../emails/_components/translator";
import { ensureApplicationConversation } from "./connect";
import { getOrgJob, HireError, hirePermissions, type HireContext } from "./hire";
import { notify } from "./notifications";

export type CompanyNoticeVariant = "received" | "retained";

export const noticeEvents = {
  received: "acknowledged",
  retained: "retained_informed",
} as const satisfies Record<CompanyNoticeVariant, string>;

/** The words of the message: greeting, letter, signature, in paragraphs. */
export function companyNoticeBody(
  variant: CompanyNoticeVariant,
  input: { firstName?: string | null; jobTitle: string; company: string },
) {
  const firstName = input.firstName?.trim();
  const values = { jobTitle: input.jobTitle, company: input.company };
  return [
    firstName ? t("companyNotice.greeting", { firstName }) : t("companyNotice.noName"),
    t(`companyNotice.${variant}.message`, values),
    t("companyNotice.signature", values),
  ].join("\n\n");
}

export type PostedNotice = {
  applicationId: string;
  conversationId: string;
  talent: { id: string; email: string; firstName: string | null; name: string };
  company: string;
  jobTitle: string;
  appliedAt: Date;
};

/**
 * Writes the letter in the conversation and tells the talent. Nothing when it was already written
 * for this application, or when the talent blocked the organization's messages.
 */
export async function postCompanyNotice(
  db: PrismaClient,
  applicationId: string,
  variant: CompanyNoticeVariant,
  actorId: string | null,
  now = new Date(),
): Promise<PostedNotice | null> {
  const type = noticeEvents[variant];
  const already = await db.applicationEvent.findFirst({
    where: { applicationId, type },
    select: { id: true },
  });
  if (already) return null;
  const application = await db.application.findUniqueOrThrow({
    where: { id: applicationId },
    select: {
      id: true,
      createdAt: true,
      job: { select: { title: true, organization: { select: { name: true } } } },
      profile: {
        select: { user: { select: { id: true, email: true, firstName: true, name: true } } },
      },
    },
  });
  const conversation = await ensureApplicationConversation(db, applicationId);
  if (conversation.blockedAt) return null;
  const talent = application.profile.user;
  const company = application.job.organization.name;
  const jobTitle = application.job.title;
  // Written in the company's name, by nobody in particular: the team sees it as « l'équipe ».
  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: null,
      kind: "text",
      body: companyNoticeBody(variant, { firstName: talent.firstName, jobTitle, company }),
      payload: { notice: variant },
      createdAt: now,
    },
  });
  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: now, orgHiddenAt: null },
  });
  await db.applicationEvent.create({
    data: { applicationId, actorId, type, payload: {}, createdAt: now },
  });
  await notify(db, {
    userIds: [talent.id],
    type: "newMessage",
    payload: { senderName: company, company, jobTitle },
    href: `/app/messages/${conversation.id}`,
  });
  return {
    applicationId,
    conversationId: conversation.id,
    talent,
    company,
    jobTitle,
    appliedAt: application.createdAt,
  };
}

/** The retained of an offer who have not been told yet (active, kept, no letter). */
export async function retainedToInform(db: PrismaClient, jobId: string) {
  const rows = await db.application.findMany({
    where: {
      jobId,
      status: "active",
      shortlistedAt: { not: null },
      events: { none: { type: noticeEvents.retained } },
    },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/**
 * « Prévenir »: the letter « Candidature retenue » to the retained of this offer not told yet, or
 * only to `ids` among them. Read through the offer (golden rule n° 6).
 */
export async function informRetained(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  ids?: string[],
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const waiting = await retainedToInform(db, job.id);
  const chosen = ids ? waiting.filter((id) => ids.includes(id)) : waiting;
  const sent: PostedNotice[] = [];
  for (const applicationId of chosen) {
    const notice = await postCompanyNotice(db, applicationId, "retained", ctx.userId, now);
    if (notice) sent.push(notice);
  }
  if (sent.length > 0)
    await db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "hire.retained_informed",
        targetType: "job",
        targetId: job.id,
        organizationId: ctx.organizationId,
        metadata: { count: sent.length },
      },
    });
  return sent;
}
