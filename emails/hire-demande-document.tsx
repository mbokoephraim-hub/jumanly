import TransactionalEmail from "./transactional";
import { documentRequestEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const jobTitle = t("foundation.sampleJobTitle");
const company = t("foundation.sampleCompany");

export default function HireDemandeDocumentPreview() {
  return (
    <TransactionalEmail
      {...documentRequestEmail(t("foundation.sampleFirstName"), {
        company,
        jobTitle,
        documentName: t("foundation.sampleDocument"),
        date: new Date("2026-10-21T09:00:00Z"),
        href: "/app/messages",
      }).props}
    />
  );
}
