/**
 * Contents of the Hire and Connect e-mails (keys `mail.*`), shared by the sending code
 * (src/server/hire-emails.tsx) and the local previews (`pnpm email:dev`).
 * Messages are never copied into an e-mail (`mail.newMessage.p2`): only who wrote and where.
 */
import { initials, type TransactionalEmailProps } from "../transactional";
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
      essential: false,
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
      essential: false,
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
      essential: false,
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
      essential: false,
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
      essential: false,
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
      essential: false,
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

/** Slots in the organizer's time zone, as the talent will read them. */
/** « heure de {timezone} »: the city of the time zone (« Africa/Kinshasa » → « Kinshasa »). */
export function zoneCity(timeZone: string) {
  return (timeZone.split("/").at(-1) ?? timeZone).replaceAll("_", " ");
}

export function slotList(slots: Date[], timeZone: string) {
  const format = new Intl.DateTimeFormat("fr", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return slots.map((slot) => format.format(slot)).join(" · ");
}

export function interviewInviteEmail(
  firstName: string | null | undefined,
  input: {
    company: string;
    jobTitle: string;
    mode: string;
    minutes: number;
    slots: Date[];
    timezone: string;
    href: string;
  },
): HireEmail {
  const values = {
    company: input.company,
    jobTitle: input.jobTitle,
    mode: input.mode,
    minutes: input.minutes,
  };
  return {
    subject: t("mail.interviewInvite.subject", values),
    props: {
      essential: false,
      preview: t("mail.interviewInvite.preheader", values),
      greeting: greeting(firstName),
      paragraphs: [
        t("mail.interviewInvite.p1", values),
        {
          text: t("mail.interviewInvite.slots", {
            slots: slotList(input.slots, input.timezone),
            timezone: zoneCity(input.timezone),
          }),
          small: true,
        },
        t("mail.interviewInvite.p2"),
      ],
      card: {
        initials: initials(input.company),
        title: input.jobTitle,
        meta: t("mail.interviewInvite.details", values),
      },
      cta: { label: t("mail.interviewInvite.cta"), href: url(input.href) },
    },
  };
}

export function interviewConfirmedEmail(
  firstName: string | null | undefined,
  input: { company: string; jobTitle: string; date: Date; timezone: string; href: string },
): HireEmail {
  const time = new Intl.DateTimeFormat("fr", {
    timeZone: input.timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(input.date);
  const values = { ...input, time, timezone: zoneCity(input.timezone) };
  return {
    subject: t("mail.interviewConfirmed.subject", values),
    props: {
      essential: false,
      preview: t("mail.interviewConfirmed.preheader", values),
      greeting: greeting(firstName),
      paragraphs: [t("mail.interviewConfirmed.p1", values), t("mail.interviewConfirmed.p2")],
      cta: { label: t("mail.interviewConfirmed.cta"), href: url(input.href) },
    },
  };
}

export function contactRequestedEmail(
  firstName: string | null | undefined,
  input: { company: string; date: Date },
): HireEmail {
  return {
    subject: t("mail.contactRequested.subject", input),
    props: {
      essential: false,
      preview: t("mail.contactRequested.preheader"),
      greeting: greeting(firstName),
      paragraphs: [
        t("mail.contactRequested.p1", input),
        t("mail.contactRequested.p2"),
        t("mail.contactRequested.p3", input),
      ],
      cta: { label: t("mail.contactRequested.cta"), href: url("/app/messages?filtre=demandes") },
    },
  };
}

export function contactAcceptedEmail(
  firstName: string | null | undefined,
  input: { candidateName: string; href: string },
): HireEmail {
  return {
    subject: t("mail.contactAccepted.subject", input),
    props: {
      essential: false,
      preview: t("mail.contactAccepted.preheader"),
      greeting: greeting(firstName),
      paragraphs: [t("mail.contactAccepted.p1", input), t("mail.contactAccepted.p2")],
      cta: { label: t("mail.contactAccepted.cta", input), href: url(input.href) },
    },
  };
}

export function orgVerificationEmail(
  firstName: string | null | undefined,
  input: { org: string; verified: boolean; reason: string },
): HireEmail {
  const key = input.verified ? "mail.orgVerified" : "mail.orgVerificationRejected";
  const values = { org: input.org, reason: input.reason };
  return {
    subject: t(`${key}.subject`, values),
    props: {
      preview: t(`${key}.preheader`, values),
      greeting: greeting(firstName),
      paragraphs: [t(`${key}.p1`, values), t(`${key}.p2`, values)],
      cta: {
        label: t(`${key}.cta`),
        href: url("/app/organisation?onglet=verification"),
      },
    },
  };
}

/** Admin v2, étape 4: complement asked, suspension and reactivation of an organization. */
export function orgNoticeEmail(
  firstName: string | null | undefined,
  input: { org: string; kind: "infoRequested" | "suspended" | "reactivated"; reason: string },
): HireEmail {
  const key = (
    {
      infoRequested: "mail.orgVerificationInfo",
      suspended: "mail.orgSuspended",
      reactivated: "mail.orgReactivated",
    } as const
  )[input.kind];
  const values = { org: input.org, reason: input.reason };
  return {
    subject: t(`${key}.subject`, values),
    props: {
      preview: t(`${key}.preheader`, values),
      greeting: greeting(firstName),
      paragraphs: [t(`${key}.p1`, values), t(`${key}.p2`, values)],
      cta: {
        label: t(`${key}.cta`),
        href: url(
          input.kind === "infoRequested"
            ? "/app/organisation?onglet=verification"
            : input.kind === "reactivated"
              ? "/app/hire"
              : "/app",
        ),
      },
    },
  };
}
