/**
 * The e-mail to a referent (« Faire vérifier », demande d'Ephraïm du 29/10/2026): who asks, what to
 * confirm, and the button that opens the one-click answer page. Texts `mail.reference.*`.
 */
import { t } from "../../emails/_components/translator";
import { initials } from "../../emails/transactional";
import { absoluteUrl, send } from "./account-emails";
import { REFERENCE_DAYS } from "./services/reference-check";

export async function sendReferenceRequest(input: {
  to: string;
  referentName: string;
  personName: string;
  /** The item as the referent should read it: « Analyste de données · Baobab Fintech ». */
  title: string;
  meta: string;
  token: string;
}) {
  await send(input.to, t("mail.reference.subject", { name: input.personName }), {
    preview: t("mail.reference.preheader", { name: input.personName }),
    greeting: t("mail.common.greeting.text", { firstName: input.referentName }),
    paragraphs: [t("mail.reference.p1", { name: input.personName })],
    card: { initials: initials(input.personName), title: input.title, meta: input.meta },
    cta: {
      label: t("mail.reference.cta", { name: input.personName }),
      href: absoluteUrl(`/confirmer-reference/${input.token}`),
    },
    footnote: `${t("mail.reference.p2", { days: REFERENCE_DAYS })} ${t("mail.reference.p3", { name: input.personName })}`,
    essential: true,
  });
}
