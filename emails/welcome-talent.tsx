import { Button, Text } from "@react-email/components";
import { EmailLayout } from "./_components/email-layout";
import { siteUrl, t } from "./_components/translator";

type Props = { firstName: string; plan: string };

const paragraph = { fontSize: 16, lineHeight: "26px", color: "#0F3F37" };

/**
 * Talent welcome e-mail. In E0 it validates the shared layout (`pnpm email:dev`);
 * sending comes with the e-mail adapter.
 */
export default function WelcomeTalentEmail({ firstName, plan }: Props) {
  return (
    <EmailLayout preview={t("mail.welcome.talent.preheader")}>
      <Text
        style={{ ...paragraph, fontSize: 22, lineHeight: "30px", fontWeight: 600, marginTop: 0 }}
      >
        {t("mail.welcome.talent.subject", { firstName })}
      </Text>
      <Text style={paragraph}>{t("mail.welcome.talent.p1", { plan })}</Text>
      <Text style={paragraph}>{t("mail.welcome.talent.p2")}</Text>
      <Text style={paragraph}>{t("mail.welcome.talent.p3")}</Text>
      <Button
        href={`${siteUrl}/app/profil`}
        style={{
          backgroundColor: "#0F3F37",
          color: "#FFFFFF",
          borderRadius: 999,
          padding: "12px 24px",
          fontWeight: 500,
        }}
      >
        {t("mail.welcome.talent.cta")}
      </Button>
    </EmailLayout>
  );
}

// Preview data for `pnpm email:dev` only (obviously fictional).
WelcomeTalentEmail.PreviewProps = {
  firstName: t("foundation.sampleFirstName"),
  plan: t("foundation.samplePlan"),
} satisfies Props;
