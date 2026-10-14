import TransactionalEmail from "./transactional";
import { certificateEmail } from "./_components/learn-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
export default function LearnAttestationPreview() {
  return (
    <TransactionalEmail
      {...certificateEmail(t("foundation.sampleFirstName"), {
        courseTitle: t("foundation.sampleCourse"),
        code: "JMN-ABCD-2345",
        certificateId: "exemple",
      }).props}
    />
  );
}
