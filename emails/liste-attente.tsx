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

export type WaitlistEmailProps = {
  locale: EmailLocale;
  firstName: string;
  email: string;
  /** Already translated: « Talent », « Recruteur »… */
  profile: string;
  country: string;
};

// Modèle B: Nuit page, Surface cards, Crème text, Lime for the action only.
const nuit = "#0B1A1F";
const surface = "#13282C";
const line = "#24393D";
const creme = colors.creme;
const brume = "#8FA39E";
const menthe = "#2FD3A6";
const signature = `linear-gradient(135deg, ${colors.sapin} 0%, #14745F 48%, ${colors.lime} 100%)`;

const text = { margin: 0, fontFamily: font, color: creme };

/**
 * « Vous êtes sur la liste d'attente » (29/10/2026): sent once, when an address joins the waitlist.
 * Dark Modèle B identity, Sapin → Lime signature gradient, Sora. Tables and inline styles only;
 * a plain Sapin colour shows where a mail app ignores gradients.
 */
export default function WaitlistEmail({
  locale,
  firstName,
  email,
  profile,
  country,
}: WaitlistEmailProps) {
  const t = translatorFor(locale);
  const [privacy, terms] = t("mail.common.footer.legal").split(" · ");
  const steps = [1, 2, 3] as const;
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
      <Preview>{t("mail.waitlist.preheader")}</Preview>
      <Body style={{ backgroundColor: nuit, fontFamily: font, margin: 0, padding: "24px 0" }}>
        <Container style={{ width: "100%", maxWidth: 600, backgroundColor: nuit }}>
          {/* Head: the signature gradient in a rounded tile, logo, badge, big title. */}
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
                    {t("mail.waitlist.badge")}
                  </Text>
                </Column>
              </Row>
              <Text
                style={{
                  ...text,
                  margin: "44px 0 12px",
                  color: colors.white,
                  fontSize: 34,
                  lineHeight: "40px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {t("mail.waitlist.title", { firstName })}
              </Text>
              <Text
                style={{
                  ...text,
                  color: colors.white,
                  fontSize: 16,
                  lineHeight: "25px",
                  maxWidth: 440,
                }}
              >
                {t("mail.waitlist.intro")}
              </Text>
            </Section>
          </Section>

          {/* What was registered. */}
          <Section style={{ padding: "16px 16px 0" }}>
            <Section
              style={{
                backgroundColor: surface,
                border: `1px solid ${line}`,
                borderRadius: 24,
                padding: "22px 26px",
              }}
            >
              <Text
                style={{
                  ...text,
                  margin: "0 0 12px",
                  color: brume,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {t("mail.waitlist.summary.title")}
              </Text>
              {(
                [
                  ["profile", profile],
                  ["country", country],
                  ["email", email],
                ] as const
              ).map(([key, value], index) => (
                <Row key={key} style={{ borderTop: index === 0 ? undefined : `1px solid ${line}` }}>
                  <Column style={{ width: 120, padding: "10px 0" }}>
                    <Text style={{ ...text, color: brume, fontSize: 13, lineHeight: "18px" }}>
                      {t(`mail.waitlist.summary.${key}`)}
                    </Text>
                  </Column>
                  <Column style={{ padding: "10px 0" }}>
                    <Text style={{ ...text, fontSize: 14, lineHeight: "18px", fontWeight: 600 }}>
                      {value}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Section>

          {/* The next three steps. */}
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
                {t("mail.waitlist.steps.title")}
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
                      {t(`mail.waitlist.steps.${step}.title`)}
                    </Text>
                    <Text style={{ ...text, color: brume, fontSize: 13.5, lineHeight: "20px" }}>
                      {t(`mail.waitlist.steps.${step}.text`)}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Section>

          {/* The action, then the sign-off. */}
          <Section style={{ padding: "30px 32px 0", textAlign: "center" }}>
            <Button
              href={siteUrl}
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
              {t("mail.waitlist.cta")}
            </Button>
            <Text style={{ ...text, margin: "22px 0 4px", fontSize: 15, lineHeight: "24px" }}>
              {t("mail.waitlist.closing")}
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
                t("mail.waitlist.footer.reason", { email }),
                t("mail.waitlist.footer.notYou"),
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
WaitlistEmail.PreviewProps = {
  locale: "fr",
  firstName: tFr("foundation.sampleFirstName"),
  email: tFr("foundation.sampleEmail"),
  profile: tFr("waitlist.form.profile.talent.label"),
  country: tFr("foundation.samplePlace"),
} satisfies WaitlistEmailProps;
