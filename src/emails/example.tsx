import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_components/email-layout";
import { emailTranslator as t, siteUrl } from "./_components/translator";

/** Example template to check the shared layout (`pnpm email:dev`). Real templates come with E4. */
export default function ExampleEmail() {
  return (
    <EmailLayout preview={t("example.preview")}>
      <Heading as="h1" style={{ fontSize: 24, lineHeight: "30px", margin: 0 }}>
        {t("example.title")}
      </Heading>
      <Text style={{ fontSize: 16, lineHeight: "26px", color: "#5B6B68" }}>
        {t("example.body")}
      </Text>
      <Button
        href={`${siteUrl}/app`}
        style={{
          backgroundColor: "#0F3F37",
          color: "#FFFFFF",
          borderRadius: 999,
          padding: "12px 24px",
          fontWeight: 500,
        }}
      >
        {t("example.cta")}
      </Button>
    </EmailLayout>
  );
}
