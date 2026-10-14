import TransactionalEmail from "./transactional";
import { applicationSentEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const jobTitle = t("foundation.sampleJobTitle");
const company = t("foundation.sampleCompany");

export default function HireCandidatureEnvoyeePreview() {
  return (
    <TransactionalEmail
      {...applicationSentEmail(t("foundation.sampleFirstName"), {
        jobTitle,
        company,
        date: new Date("2026-10-14T09:00:00Z"),
      }).props}
    />
  );
}
