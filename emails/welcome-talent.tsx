import TransactionalEmail from "./transactional";
import { siteUrl, t } from "./_components/translator";

type Props = { firstName: string; plan: string };

/**
 * Talent welcome e-mail (mockup 08-06, left): same content as `sendWelcome`, with the illustrated
 * band. Local preview (`pnpm email:dev`).
 */
export default function WelcomeTalentEmail({ firstName, plan }: Props) {
  return (
    <TransactionalEmail
      preview={t("mail.welcome.talent.preheader")}
      greeting={t("mail.common.greeting.text", { firstName })}
      paragraphs={[
        t("mail.welcome.talent.p1", { plan }),
        t("mail.welcome.talent.p2"),
        t("mail.welcome.talent.p3"),
      ]}
      cta={{ label: t("mail.welcome.talent.cta"), href: `${siteUrl}/app/profil` }}
      hero
      recipient={t("foundation.sampleEmail")}
    />
  );
}

// Preview data for `pnpm email:dev` only (obviously fictional).
WelcomeTalentEmail.PreviewProps = {
  firstName: t("foundation.sampleFirstName"),
  plan: t("foundation.samplePlan"),
} satisfies Props;
