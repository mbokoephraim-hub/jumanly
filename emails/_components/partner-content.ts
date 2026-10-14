/**
 * Contents of the Jumanly Partners e-mails (keys `email.license.*`, `mail.licenseActivated.*`,
 * `mail.partnerInvite.*`), shared by src/server/partner-emails.tsx and the local previews.
 * A licence e-mail never names anyone but its recipient and the sponsoring institution.
 */
import type { HireEmail } from "./hire-content";
import { greeting } from "./hire-content";
import { siteUrl, t } from "./translator";

/** JMLY-XXXX-XXXX (same as src/server/services/partners.ts). */
const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;

const url = (path: string) => new URL(path, siteUrl).toString();

export function licenseInviteEmail(input: {
  firstName: string | null;
  sponsorName: string;
  plan: string;
  endDate: string;
  code: string;
}): HireEmail {
  const { firstName, ...values } = input;
  return {
    subject: t("email.license.subject", values),
    props: {
      preview: t("email.license.subject", values),
      greeting: greeting(firstName),
      paragraphs: [
        t("email.license.body", { ...values, code: formatCode(values.code) }),
        t("activate.help"),
      ],
      cta: {
        label: t("email.license.cta"),
        href: url(`/activer?${new URLSearchParams({ code: input.code })}`),
      },
    },
  };
}

export function licenseActivatedEmail(
  firstName: string | null | undefined,
  input: { sponsorName: string; plan: string; date: Date; onHold: boolean },
): HireEmail {
  const { onHold, ...values } = input;
  return {
    subject: t("mail.licenseActivated.subject", values),
    props: {
      preview: t("mail.licenseActivated.preheader", values),
      greeting: greeting(firstName),
      paragraphs: [
        t("mail.licenseActivated.p1", values),
        t("mail.licenseActivated.p2", values),
        ...(onHold ? [t("mail.licenseActivated.p3.onHold")] : []),
      ],
      cta: { label: t("mail.licenseActivated.cta"), href: url("/app/abonnement") },
    },
  };
}

export function partnerInviteEmail(input: { org: string; date: Date; token: string }): HireEmail {
  return {
    subject: t("mail.partnerInvite.subject", input),
    props: {
      preview: t("mail.partnerInvite.preheader"),
      greeting: greeting(null),
      paragraphs: [
        t("mail.partnerInvite.p1", input),
        t("mail.partnerInvite.p2"),
        t("mail.orgInvite.p3", input),
      ],
      cta: { label: t("mail.partnerInvite.cta"), href: url(`/app/invitation/${input.token}`) },
    },
  };
}
