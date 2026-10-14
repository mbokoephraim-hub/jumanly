import TransactionalEmail from "./transactional";
import { orgInviteEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const company = t("foundation.sampleCompany");

export default function OrganisationInvitationPreview() {
  return (
    <TransactionalEmail
      {...orgInviteEmail({
        inviterName: t("foundation.sampleUser"),
        org: company,
        role: t("foundation.sampleRole"),
        message: "",
        date: new Date("2026-10-21T09:00:00Z"),
        token: "exemple",
      }).props}
    />
  );
}
