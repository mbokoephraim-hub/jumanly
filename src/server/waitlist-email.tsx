/**
 * « Vous êtes sur la liste d'attente » (textes, partie 07, keys `mail.waitlist.*`), in the language
 * of the site the visitor joined from.
 */
import { render, toPlainText } from "@react-email/components";
import { translatorFor, type EmailLocale } from "../../emails/_components/translator";
import WaitlistEmail from "../../emails/liste-attente";
import type { WaitlistProfile } from "@/generated/prisma/client";
import { emailSender } from "./adapters/email";

export async function sendWaitlistConfirmation(input: {
  locale: EmailLocale;
  firstName: string;
  email: string;
  profile: WaitlistProfile;
  country: string;
}) {
  const t = translatorFor(input.locale);
  const html = await render(
    <WaitlistEmail
      locale={input.locale}
      firstName={input.firstName}
      email={input.email}
      profile={t(`waitlist.form.profile.${input.profile}.label`)}
      country={input.country}
    />,
  );
  await emailSender().send({
    to: input.email,
    subject: t("mail.waitlist.subject"),
    html,
    text: toPlainText(html),
  });
}
