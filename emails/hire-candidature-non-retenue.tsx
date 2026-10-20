import TransactionalEmail from "./transactional";
import { notRetainedEmail } from "./_components/recruiter-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
export default function HireCandidatureNonRetenuePreview() {
  return (
    <TransactionalEmail
      {...notRetainedEmail(t("foundation.sampleFirstName"), {
        jobTitle: t("foundation.sampleJobTitle"),
        company: t("foundation.sampleCompany"),
        message: t("hireReplies.default.others").replaceAll("\\n", "\n"),
      }).props}
    />
  );
}
