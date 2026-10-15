import TransactionalEmail from "./transactional";
import { interviewInviteEmail } from "./_components/hire-content";
import { t } from "./_components/translator";

// Aperçu local (pnpm email:dev) avec des données manifestement fictives (maquette 08-06, à droite).
export default function HireInvitationEntretienPreview() {
  const day = new Date(Date.UTC(2026, 9, 16, 9, 0));
  return (
    <TransactionalEmail
      {...interviewInviteEmail(t("foundation.sampleFirstName"), {
        company: t("foundation.sampleCompany"),
        jobTitle: t("foundation.sampleJobTitle"),
        mode: t("foundation.sampleMode"),
        minutes: 45,
        slots: [
          day,
          new Date(day.getTime() + 5 * 3600_000),
          new Date(day.getTime() + 23.5 * 3600_000),
        ],
        timezone: "Africa/Kinshasa",
        href: "/app/jobs/candidatures",
      }).props}
      recipient={t("foundation.sampleEmail")}
    />
  );
}
