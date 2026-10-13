import type { ReactNode } from "react";
import { Body, Container, Head, Html, Img, Preview, Section, Text } from "@react-email/components";
import { createTranslator } from "next-intl";
import messages from "../../../messages/fr.json";
import { emailTranslator, siteUrl } from "./translator";

const common = createTranslator({ locale: "fr", messages, namespace: "common" });

/** Shared e-mail frame: logo, content, footer with the contact e-mail (never a phone number). */
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
            alt={common("brand.name")}
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
          <Text style={{ color: "#5B6B68", fontSize: 12, lineHeight: "18px", marginTop: 24 }}>
            {emailTranslator("layout.footer", { email: common("contact.primaryEmail") })}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
