import TransactionalEmail from "./transactional";
import { newApplicationEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const jobTitle = t("foundation.sampleJobTitle");
const company = t("foundation.sampleCompany");

export default function HireCandidatureRecuePreview() {
  return (
    <TransactionalEmail
      {...newApplicationEmail(t("foundation.sampleFirstName"), {
        candidateName: t("foundation.sampleUser"),
        jobTitle,
        org: company,
        href: "/app/hire",
      }).props}
    />
  );
}
