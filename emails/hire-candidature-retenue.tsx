import TransactionalEmail from "./transactional";
import { shortlistedEmail } from "./_components/recruiter-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
export default function HireCandidatureRetenuePreview() {
  return (
    <TransactionalEmail
      {...shortlistedEmail(t("foundation.sampleFirstName"), {
        jobTitle: t("foundation.sampleJobTitle"),
        company: t("foundation.sampleCompany"),
        place: t("foundation.samplePlace"),
        message: t("hireReplies.default.retained").replaceAll("\\n", "\n"),
        href: "/app/messages",
      }).props}
    />
  );
}
