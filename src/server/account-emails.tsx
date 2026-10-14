/**
 * Account e-mails (textes, partie 07, keys `mail.*`): verification code, sign-in link, password
 * reset and change, welcome, payment receipt. Rendered with React Email, sent through the e-mail
 * adapter (fake in local).
 */
import { render, toPlainText } from "@react-email/components";
import { siteUrl, t } from "../../emails/_components/translator";
import TransactionalEmail, { type TransactionalEmailProps } from "../../emails/transactional";
import { CODE_MINUTES } from "@/lib/password";
import { emailSender } from "./adapters/email";

export const OTP_MINUTES = CODE_MINUTES;
export const LINK_MINUTES = CODE_MINUTES;
export const RESET_MINUTES = 60;

export function greeting(firstName?: string | null) {
  return firstName
    ? t("mail.common.greeting.text", { firstName })
    : t("mail.common.greeting.noName");
}

export async function send(to: string, subject: string, props: TransactionalEmailProps) {
  const html = await render(<TransactionalEmail {...props} />);
  await emailSender().send({ to, subject, html, text: toPlainText(html) });
}

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export async function sendVerificationCode(to: string, code: string, firstName?: string | null) {
  await send(to, t("mail.verifyCode.subject", { code }), {
    preview: t("mail.verifyCode.preheader", { minutes: OTP_MINUTES }),
    greeting: greeting(firstName),
    paragraphs: [t("mail.verifyCode.p1")],
    code,
    footnote: `${t("mail.verifyCode.p2", { minutes: OTP_MINUTES })} ${t("mail.verifyCode.p3")}`,
  });
}

export async function sendMagicLink(to: string, url: string, firstName?: string | null) {
  await send(to, t("mail.magicLink.subject"), {
    preview: t("mail.magicLink.preheader", { minutes: LINK_MINUTES }),
    greeting: greeting(firstName),
    paragraphs: [t("mail.magicLink.p1", { minutes: LINK_MINUTES })],
    cta: { label: t("mail.magicLink.cta"), href: url },
    footnote: t("mail.common.notYou"),
  });
}

export async function sendResetPassword(to: string, url: string, firstName?: string | null) {
  await send(to, t("mail.resetPassword.subject"), {
    preview: t("mail.resetPassword.preheader", { minutes: RESET_MINUTES }),
    greeting: greeting(firstName),
    paragraphs: [
      t("mail.resetPassword.p1"),
      t("mail.resetPassword.p2", { minutes: RESET_MINUTES }),
    ],
    cta: { label: t("mail.resetPassword.cta"), href: url },
  });
}

export async function sendPasswordChanged(to: string, firstName: string | null, at: Date) {
  const time = new Intl.DateTimeFormat("fr", { timeStyle: "short", timeZone: "UTC" }).format(at);
  await send(to, t("mail.passwordChanged.subject"), {
    preview: t("mail.passwordChanged.preheader"),
    greeting: greeting(firstName),
    paragraphs: [t("mail.passwordChanged.p1", { date: at, time }), t("mail.passwordChanged.p2")],
    cta: { label: t("mail.passwordChanged.cta"), href: absoluteUrl("/mot-de-passe-oublie") },
  });
}

export async function sendWelcome(
  to: string,
  input:
    | { kind: "talent"; firstName: string; plan: string }
    | { kind: "recruiter" | "company"; firstName: string; plan: string; org: string },
) {
  const key = `mail.welcome.${input.kind}` as const;
  const values = { plan: input.plan, org: "org" in input ? input.org : "" };
  await send(to, t(`${key}.subject`, { firstName: input.firstName, org: values.org }), {
    preview: t(`${key}.preheader`),
    greeting: greeting(input.firstName),
    paragraphs: [t(`${key}.p1`, values), t(`${key}.p2`), t(`${key}.p3`)],
    cta: { label: t(`${key}.cta`), href: absoluteUrl("/app") },
  });
}

export async function sendPaymentReceipt(
  to: string,
  input: {
    firstName: string | null;
    plan: string;
    amount: string;
    method: string;
    startDate: Date;
    endDate: Date;
    invoiceId?: string;
  },
) {
  const { firstName, invoiceId, ...rest } = input;
  const values = { ...rest, currency: "USD", date: input.endDate };
  await send(to, t("mail.paymentSuccess.subject", { plan: input.plan }), {
    preview: t("mail.paymentSuccess.preheader", values),
    greeting: greeting(firstName),
    paragraphs: [
      t("mail.paymentSuccess.p1", values),
      t("mail.paymentSuccess.p2", values),
      ...(invoiceId ? [t("mail.paymentSuccess.p3")] : []),
    ],
    cta: invoiceId
      ? {
          label: t("mail.paymentSuccess.cta"),
          href: absoluteUrl(`/app/abonnement/factures/${invoiceId}/pdf`),
        }
      : undefined,
  });
}
