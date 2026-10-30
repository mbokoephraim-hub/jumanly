/**
 * What happens around an application, besides the database change: in-app notifications and
 * e-mails (partie 06 § 6.3). Failures to send an e-mail never undo the action.
 */
import "server-only";
import { db } from "@/server/db";
import { postCompanyNotice } from "@/server/services/company-notice";
import { ensureApplicationConversation } from "@/server/services/connect";
import { claimDueDecisionMails } from "@/server/services/hire-candidates";
import { claimDueGroupMails } from "@/server/services/hire-group-replies";
import { hiringTeam, notify } from "@/server/services/notifications";
import { mailCompanyNotice } from "./company-notice-email";
import {
  mailDocumentRequest,
  mailNewApplication,
  mailNewMessage,
  mailNotRetained,
  mailNotSelected,
  mailShortlisted,
  mailStatusChange,
} from "./hire-emails";

async function applicationDetails(applicationId: string) {
  return db.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          city: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
      profile: {
        select: { user: { select: { id: true, email: true, firstName: true, name: true } } },
      },
    },
  });
}

/**
 * A talent applied: the hiring team is told; the talent gets the company's acknowledgement, by
 * itself, in the conversation and by e-mail (Ephraïm 30/10/2026: no click from the recruiter).
 */
export async function onApplicationCreated(applicationId: string) {
  const application = await applicationDetails(applicationId);
  await ensureApplicationConversation(db, applicationId);
  const talent = application.profile.user;
  const team = await hiringTeam(db, application.job.organizationId);
  const href = `/app/hire/candidats/${applicationId}`;
  await notify(db, {
    userIds: team.map((member) => member.id),
    type: "newApplication",
    payload: { candidateName: talent.name, jobTitle: application.job.title },
    href,
  });
  await Promise.all([
    ...team.map((member) =>
      mailNewApplication(member, {
        candidateName: talent.name,
        jobTitle: application.job.title,
        org: application.job.organization.name,
        href,
      }),
    ),
    postCompanyNotice(db, applicationId, "received", null).then(
      (notice) => notice && mailCompanyNotice("received", notice),
    ),
  ]);
}

/** A human moved the application: the talent sees the new stage, by notification and e-mail. */
export async function onStageChanged(
  applicationId: string,
  to: { name: string; kind: string },
  rejectionMessage?: string,
) {
  const application = await applicationDetails(applicationId);
  const talent = application.profile.user;
  const company = application.job.organization.name;
  if (to.kind === "rejected") {
    await notify(db, {
      userIds: [talent.id],
      type: "notSelected",
      payload: { jobTitle: application.job.title, company },
      href: `/app/suivi/${applicationId}`,
    });
    await mailNotSelected(talent, {
      jobTitle: application.job.title,
      company,
      message: rejectionMessage ?? "",
    });
    return;
  }
  // The first stage is where everyone starts: moving back there is not news for the talent.
  if (to.kind === "new") return;
  await notify(db, {
    userIds: [talent.id],
    type: "statusChange",
    payload: { jobTitle: application.job.title, company, stage: to.name },
    href: `/app/suivi/${applicationId}`,
  });
  await mailStatusChange(talent, {
    jobTitle: application.job.title,
    company,
    stage: to.name,
    kind: to.kind,
  });
}

/**
 * The e-mails of the final decisions whose 10 minutes to undo are over (recruiter lot 3): called by
 * the scheduled tasks (`/api/jobs/billing`) and after the Hire pages, so they leave soon after.
 */
export async function deliverDueDecisionMails(now = new Date()) {
  const due = await claimDueDecisionMails(db, now);
  for (const item of due) {
    const application = await applicationDetails(item.applicationId);
    const talent = application.profile.user;
    const company = application.job.organization.name;
    if (item.toKind === "rejected" && item.grouped)
      await mailNotRetained(talent, {
        jobTitle: application.job.title,
        company,
        message: item.message,
      });
    else if (item.toKind === "rejected")
      await mailNotSelected(talent, {
        jobTitle: application.job.title,
        company,
        message: item.message,
      });
    else
      await mailStatusChange(talent, {
        jobTitle: application.job.title,
        company,
        stage: item.to,
        kind: item.toKind,
      });
  }
  // Grouped replies to the retained (recruteur lot 6): the letter read by the member, by e-mail.
  const grouped = await claimDueGroupMails(db, now);
  for (const item of grouped) {
    const application = await applicationDetails(item.applicationId);
    const conversation = await ensureApplicationConversation(db, item.applicationId);
    await mailShortlisted(application.profile.user, {
      jobTitle: application.job.title,
      company: application.job.organization.name,
      place: [application.job.organization.name, application.job.city].filter(Boolean).join(" · "),
      message: item.message,
      href: `/app/messages/${conversation.id}`,
    });
  }
  return due.length + grouped.length;
}

/** A message was sent: each recipient is told who wrote, never what. */
export async function onMessageSent(input: {
  conversationId: string;
  /** The message sent: its sender's photo shows beside the notification. */
  messageId?: string;
  recipients: string[];
  fromOrganization: boolean;
  senderName: string;
  documentRequest?: { name: string; due: Date };
}) {
  const conversation = await db.conversation.findUniqueOrThrow({
    where: { id: input.conversationId },
    include: {
      organization: { select: { name: true } },
      application: { select: { id: true, job: { select: { title: true } } } },
    },
  });
  const company = conversation.organization?.name ?? "";
  const jobTitle = conversation.application?.job.title ?? "";
  const href = `/app/messages/${conversation.id}`;
  const actorId = input.messageId
    ? ((await db.message.findUnique({ where: { id: input.messageId }, select: { senderId: true } }))
        ?.senderId ?? undefined)
    : undefined;
  const people = await db.user.findMany({
    where: { id: { in: input.recipients } },
    select: { id: true, email: true, firstName: true },
  });
  if (input.documentRequest) {
    await notify(db, {
      userIds: people.map((person) => person.id),
      type: "documentRequest",
      payload: { company, documentName: input.documentRequest.name },
      href,
      actorId,
    });
    await Promise.all(
      people.map((person) =>
        mailDocumentRequest(person, {
          company,
          jobTitle,
          documentName: input.documentRequest!.name,
          date: input.documentRequest!.due,
          href,
        }),
      ),
    );
    return;
  }
  await notify(db, {
    userIds: people.map((person) => person.id),
    type: "newMessage",
    payload: { senderName: input.senderName, company, jobTitle },
    href,
    actorId,
  });
  await Promise.all(
    people.map((person) =>
      mailNewMessage(person, { senderName: input.senderName, company, jobTitle, href }),
    ),
  );
}
