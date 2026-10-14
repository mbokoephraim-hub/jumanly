import TransactionalEmail from "./transactional";
import { licenseInviteEmail } from "./_components/partner-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
export default function PartenaireLicencePreview() {
  return (
    <TransactionalEmail
      {...licenseInviteEmail({
        firstName: t("foundation.sampleFirstName"),
        sponsorName: t("foundation.sampleCompany"),
        plan: "Pro",
        endDate: "21 avril 2027",
        code: "JMLYEXEMPLE0",
      }).props}
    />
  );
}
