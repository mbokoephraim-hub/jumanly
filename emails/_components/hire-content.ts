/**
 * Contents of the Hire and Connect e-mails (keys `mail.*`), shared by the sending code
 * (src/server/hire-emails.tsx) and the local previews (`pnpm email:dev`).
 * Messages are never copied into an e-mail (`mail.newMessage.p2`): only who wrote and where.
 */
import type { TransactionalEmailProps } from "../transactional";
import { siteUrl, t } from "./translator";

export type HireEmail = { subject: string; props: TransactionalEmailProps };

const url = (path: string) => new URL(path, siteUrl).toString();

export function greeting(firstName?: string | null) {
  return firstName
    ? t("mail.common.greeting.text", { firstName })
    : t("mail.common.greeting.noName");
}

export function newApplicationEmail(
  firstName: string | null | undefined,
  input: { candidateName: string; jobTitle: string; org: string; href: string },
): HireEmail {
  return {
    subject: t("mail.newApplication.subject", { jobTitle: input.jobTitle }),
    props: {
      preview: t("mail.newApplication.preheader", { candidateName: input.candidateName }),
      greeting: greeting(firstName),
      paragraphs: [
        t("mail.newApplication.p1.text", input),
        t("mail.newApplication.p2", { org: input.org }),
      ],
      cta: { label: t("mail.newApplication.cta"), href: url(input.href) },
    },
  };
}

export function applicationSentEmail(
  firstName: string | null | undefined,
  input: { jobTitle: string; company: string; date: Date },
): HireEmail {
  return {
    subject: t("mail.applicationSent.subject", input),
    props: {
      preview: t("mail.applicationSent.preheader"),
      greeting: greeting(firstName),
      paragraphs: [t("mail.applicationSent.p1", input), t("mail.applicationSent.p2")],
      cta: { label: t("mail.applicationSent.cta"), href: url("/app/jobs/candidatures") },
    },
  };
}

const statusNotes = {
  screening: "shortlisted",
  test: "test",
  offer: "offer",
  hired: "hired",
} as const;

export function statusChangeEmail(
  firstName: string | null | undefined,
  input: { jobTitle: string; company: string; stage: string; kind: string },
): HireEmail {
  const note = statusNotes[input.kind as keyof typeof statusNotes];
  return {
    subject: t("mail.statusChange.subject", { company: input.company }),
    props: {
      preview: t("mail.statusChange.preheader", { stage: input.stage }),
      greeting: greeting(firstName),
      paragraphs: [
        t("mail.statusChange.p1", input),
        ...(note ? [t(`mail.statusChange.p2.${note}`, input)] : []),
      ],
      cta: { label: t("mail.statusChange.cta"), href: url("/app/jobs/candidatures") },
    },
  };
}

export function notSelectedEmail(
  firstName: string | null | undefined,
  input: { jobTitle: string; company: string; message: string },
): HireEmail {
  return {
    subject: t("mail.notSelected.subject", { company: input.company }),
    props: {
      preview: t("mail.notSelected.preheader", { company: input.company }),
      greeting: greeting(firstName),
      paragraphs: [
        t("mail.notSelected.p1", input),
        ...(input.message ? [t("mail.notSelected.message", { message: input.message })] : []),
        t("mail.notSelected.p2"),
      ],
      cta: { label: t("mail.notSelected.cta"), href: url("/app/jobs") },
    },
  };
}

export function documentRequestEmail(
  firstName: string | null | undefined,
  input: { company: string; jobTitle: string; documentName: string; date: Date; href: string },
): HireEmail {
  return {
    subject: t("mail.documentRequest.subject", { company: input.company }),
    props: {
      preview: t("mail.documentRequest.preheader", input),
      greeting: greeting(firstName),
      paragraphs: [t("mail.documentRequest.p1", input), t("mail.documentRequest.p2", input)],
      cta: { label: t("mail.documentRequest.cta"), href: url(input.href) },
    },
  };
}

export function newMessageEmail(
  firstName: string | null | undefined,
  input: { senderName: string; company: string; jobTitle: string; href: string },
): HireEmail {
  return {
    subject: t("mail.newMessage.subject", { count: 1, senderName: input.senderName }),
    props: {
      preview: t("mail.newMessage.p2"),
      greeting: greeting(firstName),
      paragraphs: [t("mail.newMessage.p1", input), t("mail.newMessage.p2")],
      cta: { label: t("mail.newMessage.cta"), href: url(input.href) },
    },
  };
}

export function orgInviteEmail(input: {
  inviterName: string;
  org: string;
  role: string;
  message: string;
  date: Date;
  token: string;
}): HireEmail {
  return {
    subject: t("mail.orgInvite.subject", input),
    props: {
      preview: t("mail.orgInvite.preheader", input),
      greeting: greeting(null),
      paragraphs: [
        t("mail.orgInvite.p1", input),
        ...(input.message ? [t("mail.orgInvite.message", { message: input.message })] : []),
        t("mail.orgInvite.p2"),
        t("mail.orgInvite.p3", input),
      ],
      cta: { label: t("mail.orgInvite.cta", input), href: url(`/app/invitation/${input.token}`) },
    },
  };
}
