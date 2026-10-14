/**
 * Billing e-mails (textes, partie 07, keys `mail.paymentFailed`, `mail.renewal.*`, `mail.grace`,
 * `mail.downgraded`). The receipt is in account-emails.tsx.
 */
import { t } from "../../emails/_components/translator";
import { GRACE_DAYS } from "@/server/entitlements/periods";
import { absoluteUrl, greeting, send } from "./account-emails";

type Recipient = { email: string; firstName: string | null };

const renewHref = absoluteUrl("/app/abonnement");

export async function sendPaymentFailed(
  to: Recipient,
  input: { plan: string; amount: string; activeUntil: Date | null },
) {
  const values = {
    plan: input.plan,
    amount: input.amount,
    currency: "USD",
    date: input.activeUntil ?? new Date(),
  };
  await send(to.email, t("mail.paymentFailed.subject"), {
    preview: t("mail.paymentFailed.preheader", values),
    greeting: greeting(to.firstName),
    paragraphs: [
      t("mail.paymentFailed.p1", values),
      t("mail.paymentFailed.p2"),
      ...(input.activeUntil ? [t("mail.paymentFailed.p3", values)] : []),
    ],
    cta: { label: t("mail.paymentFailed.cta"), href: renewHref },
  });
}

export async function sendRenewalReminder(
  to: Recipient,
  step: "j7" | "j3" | "j0",
  input: { plan: string; date: Date; freePlan: string },
) {
  const values = { ...input, graceDays: GRACE_DAYS };
  const key = `mail.renewal.${step}` as const;
  await send(to.email, t(`${key}.subject`, values), {
    preview: t(`${key}.preheader`, values),
    greeting: greeting(to.firstName),
    paragraphs: [t(`${key}.p1`, values), t(`${key}.p2`, values)],
    cta: { label: t(`${key}.cta`), href: renewHref },
  });
}

export async function sendGrace(
  to: Recipient,
  input: { plan: string; graceEnd: Date; freePlan: string },
) {
  const values = { ...input, date: input.graceEnd };
  await send(to.email, t("mail.grace.subject", values), {
    preview: t("mail.grace.preheader", values),
    greeting: greeting(to.firstName),
    paragraphs: [t("mail.grace.p1", values), t("mail.grace.p2", values)],
    cta: { label: t("mail.grace.cta"), href: renewHref },
  });
}

export async function sendDowngraded(
  to: Recipient,
  input: { plan: string; freePlan: string; organization: boolean },
) {
  const values = { plan: input.plan, freePlan: input.freePlan };
  await send(to.email, t("mail.downgraded.subject", values), {
    preview: t("mail.downgraded.preheader", values),
    greeting: greeting(to.firstName),
    paragraphs: [
      t("mail.downgraded.p1", values),
      t("mail.downgraded.p2", values),
      input.organization ? t("mail.downgraded.p3.org", values) : t("mail.downgraded.p3.talent"),
    ],
    cta: { label: t("mail.downgraded.cta", values), href: renewHref },
  });
}
