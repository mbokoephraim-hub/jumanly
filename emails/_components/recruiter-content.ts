/**
 * E-mails of the recruiter lot 6 (docs/refonte-mobile/modeles-recruteur, keys `mail.rh6.*`):
 * candidature retenue, candidature non retenue, demande pour rejoindre une organisation, rappel de
 * fin d'offre. 600 px, Jumanly's colours, the two contact addresses in the footer, never a phone
 * number. The letter of a grouped reply is the member's text, read before it left.
 */
import { initials } from "../transactional";
import { greeting, type HireEmail } from "./hire-content";
import { siteUrl, t } from "./translator";

const url = (path: string) => new URL(path, siteUrl).toString();

/** The member's letter as paragraphs, without its first « Bonjour … » line (the greeting is ours). */
export function letterParagraphs(message: string) {
  const paragraphs = message
    .split(/\n\s*\n/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return /^(bonjour|bonsoir|cher|chère|madame|monsieur)\b/iu.test(paragraphs[0] ?? "")
    ? paragraphs.slice(1)
    : paragraphs;
}

export function shortlistedEmail(
  firstName: string | null | undefined,
  input: {
    jobTitle: string;
    company: string;
    place: string;
    message: string;
    href: string;
  },
): HireEmail {
  const letter = letterParagraphs(input.message);
  return {
    subject: t("mail.rh6.shortlisted.subject", input),
    props: {
      essential: false,
      preview: t("mail.rh6.shortlisted.preheader", input),
      banner: {
        badge: t("mail.rh6.shortlisted.badge"),
        title: t("mail.rh6.shortlisted.title"),
        sub: t("mail.rh6.shortlisted.sub", input),
        tone: "lime",
      },
      greeting: greeting(firstName),
      paragraphs: letter.length ? letter : [t("mail.rh6.shortlisted.p1", input)],
      card: { initials: initials(input.company), title: input.jobTitle, meta: input.place },
      steps: {
        title: t("mail.rh6.shortlisted.stepsTitle"),
        items: [1, 2, 3].map((n) => ({
          title: t(`mail.rh6.shortlisted.step${n as 1}.title`),
          text: t(`mail.rh6.shortlisted.step${n as 1}.text`),
        })),
      },
      cta: { label: t("mail.rh6.shortlisted.cta"), href: url(input.href) },
      footnote: t("mail.rh6.shortlisted.note"),
    },
  };
}

export function notRetainedEmail(
  firstName: string | null | undefined,
  input: { jobTitle: string; company: string; message: string },
): HireEmail {
  const letter = letterParagraphs(input.message);
  return {
    subject: t("mail.rh6.notRetained.subject", input),
    props: {
      essential: false,
      preview: t("mail.rh6.notRetained.preheader", input),
      banner: {
        badge: t("mail.rh6.notRetained.badge"),
        title: t("mail.rh6.notRetained.title"),
        sub: t("mail.rh6.notRetained.sub", input),
        tone: "creme",
      },
      greeting: greeting(firstName),
      paragraphs: letter.length ? letter : [t("mail.rh6.notRetained.p1", input)],
      steps: {
        title: t("mail.rh6.notRetained.stepsTitle"),
        boxed: true,
        items: [1, 2, 3].map((n) => ({
          title: t(`mail.rh6.notRetained.step${n as 1}.title`),
          text: t(`mail.rh6.notRetained.step${n as 1}.text`),
        })),
      },
      cta: { label: t("mail.rh6.notRetained.cta"), href: url("/app/jobs") },
      footnote: t("mail.rh6.notRetained.note"),
    },
  };
}

export function joinRequestEmail(
  firstName: string | null | undefined,
  input: {
    name: string;
    org: string;
    domain: boolean;
    seatsAfter: string;
  },
): HireEmail {
  const values = { name: input.name, org: input.org, seatsAfter: input.seatsAfter };
  return {
    subject: t("mail.rh6.join.subject", values),
    props: {
      essential: true,
      preview: t("mail.rh6.join.preheader", values),
      banner: {
        badge: t("mail.rh6.join.badge"),
        title: t("mail.rh6.join.title", values),
        sub: t("mail.rh6.join.sub", values),
        tone: "ambre",
      },
      greeting: greeting(firstName),
      paragraphs: [t("mail.rh6.join.p1", values)],
      card: {
        initials: initials(input.name),
        title: input.name,
        meta: input.domain ? t("mail.rh6.join.domain") : t("mail.rh6.join.name"),
      },
      steps: {
        title: t("mail.rh6.join.stepsTitle"),
        items: [
          { title: t("mail.rh6.join.step1.title"), text: t("mail.rh6.join.step1.text") },
          {
            title: t("mail.rh6.join.step2.title"),
            text: t("mail.rh6.join.step2.text", values),
          },
          { title: t("mail.rh6.join.step3.title"), text: t("mail.rh6.join.step3.text") },
        ],
      },
      cta: { label: t("mail.rh6.join.cta"), href: url("/app/notifications") },
      footnote: t("mail.rh6.join.note"),
    },
  };
}

export function endingEmail(
  firstName: string | null | undefined,
  input: {
    jobTitle: string;
    days: number;
    date: Date;
    applications: number;
    views: number;
    interviews: number;
    href: string;
  },
): HireEmail {
  return {
    subject: t("mail.rh6.ending.subject", input),
    props: {
      essential: false,
      preview: t("mail.rh6.ending.preheader", input),
      banner: {
        badge: t("mail.rh6.ending.badge", input),
        title: t("mail.rh6.ending.title", input),
        sub: t("mail.rh6.ending.sub", input),
        tone: "ambre",
      },
      greeting: greeting(firstName),
      paragraphs: [t("mail.rh6.ending.p1", input)],
      figures: [
        {
          value: input.applications.toLocaleString("fr-FR"),
          label: t("mail.rh6.ending.applications", { count: input.applications }),
        },
        {
          value: input.views.toLocaleString("fr-FR"),
          label: t("mail.rh6.ending.views", { count: input.views }),
        },
        {
          value: input.interviews.toLocaleString("fr-FR"),
          label: t("mail.rh6.ending.interviews", { count: input.interviews }),
        },
      ],
      steps: {
        title: t("mail.rh6.ending.stepsTitle"),
        items: [1, 2, 3, 4].map((n) => ({
          title: t(`mail.rh6.ending.step${n as 1}.title`),
          text: t(`mail.rh6.ending.step${n as 1}.text`),
        })),
      },
      cta: { label: t("mail.rh6.ending.cta"), href: url(input.href) },
      footnote: t("mail.rh6.ending.note", input),
    },
  };
}
