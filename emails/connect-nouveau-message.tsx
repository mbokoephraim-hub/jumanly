import TransactionalEmail from "./transactional";
import { newMessageEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
const jobTitle = t("foundation.sampleJobTitle");
const company = t("foundation.sampleCompany");

export default function ConnectNouveauMessagePreview() {
  return (
    <TransactionalEmail
      {...newMessageEmail(t("foundation.sampleFirstName"), {
        senderName: t("foundation.sampleUser"),
        company,
        jobTitle,
        href: "/app/messages",
      }).props}
    />
  );
}
