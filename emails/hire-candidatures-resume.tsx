import TransactionalEmail from "./transactional";
import { newApplicationsDigestEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const jobTitle = t("foundation.sampleJobTitle");
const company = t("foundation.sampleCompany");

export default function HireCandidaturesResumePreview() {
  return (
    <TransactionalEmail
      {...newApplicationsDigestEmail(t("foundation.sampleFirstName"), {
        org: company,
        jobs: [{ title: jobTitle, count: 3 }],
        href: "/app/hire/candidats",
      }).props}
    />
  );
}
