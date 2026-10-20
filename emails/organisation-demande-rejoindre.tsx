import TransactionalEmail from "./transactional";
import { joinRequestEmail } from "./_components/recruiter-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
export default function OrganisationDemandeRejoindrePreview() {
  return (
    <TransactionalEmail
      {...joinRequestEmail(t("foundation.sampleFirstName"), {
        name: t("foundation.sampleUser"),
        org: t("foundation.sampleCompany"),
        domain: true,
        seatsAfter: "2 / 3",
      }).props}
    />
  );
}
