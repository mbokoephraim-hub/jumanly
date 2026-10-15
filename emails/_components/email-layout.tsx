import type { ReactNode } from "react";
import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { siteUrl, t } from "./translator";

export const colors = {
  sapin: "#0F3F37",
  lime: "#A6F26B",
  neon: "#E3F67C",
  creme: "#F2EDE5",
  ardoise: "#5B6B68",
  brume: "#DCE5E1",
  white: "#FFFFFF",
};

export const font = "Sora, 'Segoe UI', Arial, sans-serif";

/** E-mail pictures are PNG (ressources/LISEZMOI.md): many mail apps do not show SVG. */
export const emailImage = (file: string) => `${siteUrl}/marque/email/${file}`;

const footerText = {
  color: colors.ardoise,
  fontSize: 12,
  lineHeight: "18px",
  margin: "0 0 8px",
  textAlign: "center" as const,
};
const footerLink = { color: colors.ardoise, textDecoration: "none" };

/**
 * Shared e-mail frame (mockup 08-06): 600 px wide, Sapin header with the logo and the slogan, white
 * card overlapping it, footer with the contact e-mails (never a phone number). Security and account
 * e-mails carry the « essential » line; the others a link to the e-mail preferences.
 * Tables and inline styles only, for mail apps.
 */
export function EmailLayout({
  preview,
  recipient,
  essential = true,
  hero,
  children,
}: {
  preview: string;
  /** Address the e-mail goes to, for the « Vous recevez cet e-mail… » line. */
  recipient?: string;
  essential?: boolean;
  /** Lime illustrated band at the top of the card (welcome e-mails). */
  hero?: boolean;
  children: ReactNode;
}) {
  const [privacy, terms] = t("mail.common.footer.legal").split(" · ");
  const preferences = `${siteUrl}/app/parametres?onglet=confidentialite`;
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.creme, fontFamily: font, margin: 0, padding: 0 }}>
        <Container style={{ width: "100%", maxWidth: 600, backgroundColor: colors.creme }}>
          <Section style={{ backgroundColor: colors.sapin, padding: "28px 40px" }}>
            <Row>
              <Column>
                <Img
                  src={emailImage("jumanly-email-logo-negatif.png")}
                  alt={t("common.brand")}
                  width={135}
                  height={28}
                />
              </Column>
              <Column align="right">
                <Text
                  style={{
                    margin: 0,
                    color: colors.neon,
                    fontSize: 11,
                    lineHeight: "15px",
                    fontWeight: 600,
                  }}
                >
                  {t("mail.common.footer.tagline")}
                </Text>
              </Column>
            </Row>
          </Section>
          {/* The card overlaps the header by 18 px: Sapin above, Crème below (Crème where the
              mail app ignores gradients). */}
          <Section
            style={{
              backgroundColor: colors.creme,
              backgroundImage: `linear-gradient(${colors.sapin} 0, ${colors.sapin} 18px, ${colors.creme} 18px)`,
              padding: "0 24px",
            }}
          >
            <Section
              style={{ backgroundColor: colors.white, borderRadius: 24, color: colors.sapin }}
            >
              {hero && (
                <Img
                  src={emailImage("jumanly-email-bienvenue.png")}
                  alt=""
                  width={552}
                  height={170}
                  style={{ width: "100%", height: "auto", borderRadius: "24px 24px 0 0" }}
                />
              )}
              <Section style={{ padding: hero ? "24px 36px 30px" : "36px 36px 30px" }}>
                {children}
                <Text style={{ fontSize: 15, lineHeight: "24px", margin: "16px 0" }}>
                  {t("mail.common.signature")}
                </Text>
                <Section style={{ borderTop: `1px solid ${colors.brume}`, paddingTop: 16 }}>
                  <Row>
                    <Column style={{ width: 22, verticalAlign: "top", paddingTop: 2 }}>
                      <Img src={emailImage("jumanly-email-securite.png")} alt="" width={14} />
                    </Column>
                    <Column>
                      <Text
                        style={{
                          margin: 0,
                          fontSize: 11,
                          lineHeight: "15px",
                          color: colors.ardoise,
                        }}
                      >
                        {t("mail.common.safety")}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              </Section>
            </Section>
          </Section>
          <Section style={{ padding: "24px 40px 36px", textAlign: "center" }}>
            <Img
              src={emailImage("jumanly-email-pictogramme.png")}
              alt=""
              width={28}
              height={28}
              style={{ margin: "0 auto 8px" }}
            />
            <Text style={{ ...footerText, color: colors.sapin, fontWeight: 600 }}>
              {t("mail.common.footer.developedBy")}
            </Text>
            <Text style={footerText}>{t("mail.common.footer.contact")}</Text>
            {recipient && (
              <Text style={footerText}>{t("mail.common.footer.reason", { email: recipient })}</Text>
            )}
            <Text style={footerText}>
              {essential ? (
                t("mail.common.footer.essential")
              ) : (
                <>
                  <Link href={preferences} style={footerLink}>
                    {t("mail.common.footer.unsubscribe")}
                  </Link>
                  {" · "}
                  <Link href={preferences} style={footerLink}>
                    {t("mail.common.footer.preferences")}
                  </Link>
                </>
              )}
            </Text>
            <Text style={{ ...footerText, margin: 0 }}>
              <Link href={`${siteUrl}/confidentialite`} style={footerLink}>
                {privacy}
              </Link>
              {" · "}
              <Link href={`${siteUrl}/conditions`} style={footerLink}>
                {terms}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
