/**
 * E-mails of the platform test (30/10/2026, keys `mail.test.*`): the invitation with the hidden
 * sign-up link and the end-of-test questionnaire, in the language the person joined the list in.
 */
import { render, toPlainText } from "@react-email/components";
import { siteUrl, translatorFor, type EmailLocale } from "../../emails/_components/translator";
import TestEmail from "../../emails/test-plateforme";
import type { WaitlistEntry } from "@/generated/prisma/client";
import { defaultTimeZone } from "@/lib/dates";
import { signupHref } from "@/lib/signup";
import { emailDeliveryAvailable, emailSender } from "./adapters/email";
import { db } from "./db";
import { reportError } from "./observability";
import { dueSurveys, signupProfileOf } from "./services/waitlist-test";

const DAY = 24 * 60 * 60 * 1000;

function localeOf(entry: Pick<WaitlistEntry, "locale">): EmailLocale {
  return entry.locale === "en" ? "en" : "fr";
}

/** The questionnaire link; an English speaker goes through /langue so the page is in English. */
export function surveyUrl(token: string, locale: EmailLocale) {
  const path = `/questionnaire-test/${token}`;
  return locale === "en"
    ? `${siteUrl}/langue?${new URLSearchParams({ vers: "en", suite: path })}`
    : `${siteUrl}${path}`;
}

async function send(entry: WaitlistEntry, kind: "invite" | "survey") {
  const locale = localeOf(entry);
  const t = translatorFor(locale);
  const ends = entry.testEndsAt ?? new Date();
  const days = entry.invitedAt
    ? Math.max(1, Math.round((ends.getTime() - entry.invitedAt.getTime()) / DAY))
    : 0;
  const href =
    kind === "invite"
      ? `${siteUrl}${signupHref({ profil: signupProfileOf[entry.profile] })}`
      : surveyUrl(entry.surveyToken ?? "", locale);
  const html = await render(
    <TestEmail
      locale={locale}
      kind={kind}
      firstName={entry.firstName}
      email={entry.email}
      href={href}
      days={days}
      endDate={new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: defaultTimeZone(),
      }).format(ends)}
    />,
  );
  await emailSender().send({
    to: entry.email,
    subject: t(`mail.test.${kind}.subject`),
    html,
    text: toPlainText(html),
  });
}

export const sendTestInvitation = (entry: WaitlistEntry) => send(entry, "invite");
export const sendTestSurvey = (entry: WaitlistEntry) => send(entry, "survey");

/** Sends the questionnaire and records it; false when the e-mail could not leave. */
export async function deliverTestSurvey(entry: WaitlistEntry): Promise<boolean> {
  try {
    await sendTestSurvey(entry);
    await db.waitlistEntry.update({ where: { id: entry.id }, data: { surveySentAt: new Date() } });
    return true;
  } catch (error) {
    void reportError(error, { message: "Test de la plateforme : questionnaire non envoyé" });
    return false;
  }
}

/** Hourly job: the questionnaire of every test period that has just ended. */
export async function sendDueTestSurveys(now = new Date()) {
  if (!emailDeliveryAvailable()) return 0;
  let sent = 0;
  for (const entry of await dueSurveys(db, now)) {
    if (await deliverTestSurvey(entry)) sent += 1;
  }
  return sent;
}
