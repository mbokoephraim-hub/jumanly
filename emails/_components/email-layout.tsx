import type { ReactNode } from "react";
import { Body, Container, Head, Html, Img, Preview, Section, Text } from "@react-email/components";
import { siteUrl, t } from "./translator";

const footerText = { color: "#5B6B68", fontSize: 12, lineHeight: "18px", margin: "4px 0" };

/** Shared e-mail frame: logo, content, footer with the contact e-mails (never a phone number). */
export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: "#F2EDE5", fontFamily: "Sora, Arial, sans-serif", margin: 0 }}
      >
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
          <Img
            src={`${siteUrl}/marque/jumanly-logo-principal.svg`}
            alt={t("common.brand")}
            width={145}
            height={30}
          />
          <Section
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 28,
              padding: 32,
              marginTop: 24,
              color: "#0F3F37",
            }}
          >
            {children}
          </Section>
          <Section style={{ marginTop: 24 }}>
            <Text style={{ ...footerText, color: "#0F3F37", fontWeight: 600 }}>
              {t("mail.common.footer.tagline")}
            </Text>
            <Text style={footerText}>{t("mail.common.footer.developedBy")}</Text>
            <Text style={footerText}>{t("mail.common.footer.contact")}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
