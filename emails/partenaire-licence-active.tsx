import TransactionalEmail from "./transactional";
import { licenseActivatedEmail } from "./_components/partner-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
export default function PartenaireLicenceActivePreview() {
  return (
    <TransactionalEmail
      {...licenseActivatedEmail(t("foundation.sampleFirstName"), {
        sponsorName: t("foundation.sampleCompany"),
        plan: "Pro",
        date: new Date("2027-04-21T09:00:00Z"),
        onHold: false,
      }).props}
    />
  );
}
