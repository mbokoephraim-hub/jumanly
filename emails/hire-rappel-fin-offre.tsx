import TransactionalEmail from "./transactional";
import { endingEmail } from "./_components/recruiter-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives.
export default function HireRappelFinOffrePreview() {
  return (
    <TransactionalEmail
      {...endingEmail(t("foundation.sampleFirstName"), {
        jobTitle: t("foundation.sampleJobTitle"),
        days: 3,
        date: new Date("2026-10-31T23:59:59Z"),
        applications: 24,
        views: 1240,
        interviews: 3,
        href: "/app/hire/offres",
      }).props}
    />
  );
}
