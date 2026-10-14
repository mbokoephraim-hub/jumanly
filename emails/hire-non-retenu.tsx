import TransactionalEmail from "./transactional";
import { notSelectedEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const jobTitle = t("foundation.sampleJobTitle");
const company = t("foundation.sampleCompany");

export default function HireNonRetenuPreview() {
  return (
    <TransactionalEmail
      {...notSelectedEmail(t("foundation.sampleFirstName"), { jobTitle, company, message: "" })
        .props}
    />
  );
}
