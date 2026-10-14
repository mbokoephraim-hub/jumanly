import TransactionalEmail from "./transactional";
import { statusChangeEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const jobTitle = t("foundation.sampleJobTitle");
const company = t("foundation.sampleCompany");

export default function HireChangementEtapePreview() {
  return (
    <TransactionalEmail
      {...statusChangeEmail(t("foundation.sampleFirstName"), {
        jobTitle,
        company,
        stage: t("foundation.sampleStage"),
        kind: "interview",
      }).props}
    />
  );
}
