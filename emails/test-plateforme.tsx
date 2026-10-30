import {
  Body,
  Button,
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
import { colors, emailImage, font } from "./_components/email-layout";
import { siteUrl, t as tFr, translatorFor, type EmailLocale } from "./_components/translator";

export type TestEmailProps = {
  locale: EmailLocale;
  /** « invite »: the hidden sign-up link and the test period; « survey »: the questionnaire. */
  kind: "invite" | "survey";
  firstName: string;
  email: string;
  /** Absolute link of the button. */
  href: string;
  days: number;
  /** End of the test, already formatted in the person's language. */
  endDate: string;
};

// Same identity as the waitlist e-mail (emails/liste-attente.tsx): Modèle B, dark.
const nuit = "#0B1A1F";
const surface = "#13282C";
const line = "#24393D";
const creme = colors.creme;
const brume = "#8FA39E";
const menthe = "#2FD3A6";
const signature = `linear-gradient(135deg, ${colors.sapin} 0%, #14745F 48%, ${colors.lime} 100%)`;

const text = { margin: 0, fontFamily: font, color: creme };

/**
 * Test of the platform (30/10/2026): the invitation with the hidden sign-up link, then the
 * end-of-test questionnaire. Tables and inline styles only.
 */
export default function TestEmail({
  locale,
  kind,
  firstName,
  email,
  href,
  days,
  endDate,
}: TestEmailProps) {
  const t = translatorFor(locale);
  const [privacy, terms] = t("mail.common.footer.legal").split(" · ");
  const steps = [1, 2, 3] as const;
  const values = { firstName, email, days, date: endDate };
  return (
    <Html lang={locale}>
      <Head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- an e-mail, not a page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{t(`mail.test.${kind}.preheader`, values)}</Preview>
      <Body style={{ backgroundColor: nuit, fontFamily: font, margin: 0, padding: "24px 0" }}>
        <Container style={{ width: "100%", maxWidth: 600, backgroundColor: nuit }}>
          <Section style={{ padding: "0 16px" }}>
            <Section
              style={{
                backgroundColor: colors.sapin,
                backgroundImage: signature,
                borderRadius: 28,
                padding: "30px 32px 34px",
              }}
            >
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
                      ...text,
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: 99,
                      backgroundColor: nuit,
                      color: colors.lime,
                      fontSize: 11,
                      lineHeight: "14px",
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {t(`mail.test.${kind}.badge`)}
                  </Text>
                </Column>
              </Row>
              <Text
                style={{
                  ...text,
                  margin: "44px 0 12px",
                  color: colors.white,
                  fontSize: 32,
                  lineHeight: "38px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {t(`mail.test.${kind}.title`, values)}
              </Text>
              <Text
                style={{
                  ...text,
                  color: colors.white,
                  fontSize: 16,
                  lineHeight: "25px",
                  maxWidth: 460,
                }}
              >
                {t(`mail.test.${kind}.intro`, values)}
              </Text>
            </Section>
          </Section>

          <Section style={{ padding: "16px 16px 0" }}>
            <Section
              style={{
                backgroundColor: surface,
                border: `1px solid ${line}`,
                borderRadius: 24,
                padding: "24px 26px 10px",
              }}
            >
              <Text
                style={{
                  ...text,
                  margin: "0 0 10px",
                  fontSize: 20,
                  lineHeight: "26px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                {t(`mail.test.${kind}.steps.title`)}
              </Text>
              {steps.map((step) => (
                <Row key={step} style={{ margin: "0 0 16px" }}>
                  <Column style={{ width: 46, verticalAlign: "top" }}>
                    <Text
                      style={{
                        ...text,
                        width: 32,
                        height: 32,
                        lineHeight: "32px",
                        borderRadius: 16,
                        backgroundColor:
                          step === 1 ? colors.lime : step === 2 ? menthe : colors.neon,
                        color: colors.sapin,
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {step}
                    </Text>
                  </Column>
                  <Column>
                    <Text
                      style={{
                        ...text,
                        margin: "0 0 3px",
                        fontSize: 15,
                        lineHeight: "21px",
                        fontWeight: 600,
                      }}
                    >
                      {t(`mail.test.${kind}.steps.${step}.title`, values)}
                    </Text>
                    <Text style={{ ...text, color: brume, fontSize: 13.5, lineHeight: "20px" }}>
                      {t(`mail.test.${kind}.steps.${step}.text`, values)}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Section>

          <Section style={{ padding: "30px 32px 0", textAlign: "center" }}>
            <Button
              href={href}
              style={{
                backgroundColor: colors.lime,
                color: colors.sapin,
                borderRadius: 999,
                padding: "16px 30px",
                fontFamily: font,
                fontSize: 15,
                lineHeight: "18px",
                fontWeight: 700,
              }}
            >
              {t(`mail.test.${kind}.cta`)}
            </Button>
            <Text
              style={{
                ...text,
                margin: "14px 0 0",
                color: brume,
                fontSize: 12,
                lineHeight: "18px",
              }}
            >
              {t("mail.test.linkHelp")}{" "}
              <Link href={href} style={{ color: brume, wordBreak: "break-all" }}>
                {href}
              </Link>
            </Text>
            <Text style={{ ...text, margin: "22px 0 4px", fontSize: 15, lineHeight: "24px" }}>
              {t(`mail.test.${kind}.closing`)}
            </Text>
            <Text style={{ ...text, fontSize: 15, lineHeight: "24px", fontWeight: 600 }}>
              {t("mail.common.signature")}
            </Text>
            <Text
              style={{
                ...text,
                margin: "18px 0 0",
                color: colors.lime,
                fontSize: 13,
                lineHeight: "18px",
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {t("mail.common.footer.tagline")}
            </Text>
          </Section>

          {/* Footer: contact by e-mail only (never a phone number). */}
          <Section style={{ padding: "26px 40px 12px", textAlign: "center" }}>
            <Section style={{ borderTop: `1px solid ${line}`, paddingTop: 22 }}>
              <Img
                src={emailImage("jumanly-email-pictogramme.png")}
                alt=""
                width={28}
                height={28}
                style={{ margin: "0 auto 10px" }}
              />
              {[
                t("mail.common.footer.developedBy"),
                t("mail.common.footer.contact"),
                t("mail.test.footer.reason", { email }),
              ].map((item, index) => (
                <Text
                  key={index}
                  style={{
                    ...text,
                    margin: "0 0 8px",
                    color: index === 0 ? creme : brume,
                    fontSize: 12,
                    lineHeight: "18px",
                    fontWeight: index === 0 ? 600 : 400,
                  }}
                >
                  {item}
                </Text>
              ))}
              <Text style={{ ...text, color: brume, fontSize: 12, lineHeight: "18px" }}>
                <Link href={`${siteUrl}/confidentialite`} style={{ color: brume }}>
                  {privacy}
                </Link>
                {" · "}
                <Link href={`${siteUrl}/conditions`} style={{ color: brume }}>
                  {terms}
                </Link>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Preview data for `pnpm email:dev` only (obviously fictional).
TestEmail.PreviewProps = {
  locale: "fr",
  kind: "invite",
  firstName: tFr("foundation.sampleFirstName"),
  email: tFr("foundation.sampleEmail"),
  href: `${siteUrl}/inscription?profil=talent`,
  days: 14,
  endDate: "13 novembre 2026",
} satisfies TestEmailProps;
