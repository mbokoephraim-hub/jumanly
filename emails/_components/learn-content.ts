/** Learn e-mails (keys `mail.certificate.*`), shared by the sending code and the local preview. */
import type { HireEmail } from "./hire-content";
import { greeting } from "./hire-content";
import { siteUrl, t } from "./translator";

const url = (path: string) => new URL(path, siteUrl).toString();

export function certificateEmail(
  firstName: string | null | undefined,
  input: { courseTitle: string; code: string; certificateId: string },
): HireEmail {
  const verifyUrl = url(`/attestations/${input.code}`);
  return {
    subject: t("mail.certificate.subject", { firstName: firstName ?? "" }).replace(/\s+,/, ","),
    props: {
      preview: t("mail.certificate.preheader", input),
      greeting: greeting(firstName),
      paragraphs: [t("mail.certificate.p1", input), t("mail.certificate.p2", { verifyUrl })],
      cta: {
        label: t("mail.certificate.cta"),
        href: url(`/app/learn/attestations/${input.certificateId}/pdf`),
      },
    },
  };
}
