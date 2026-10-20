import { Button, Column, Row, Section, Text } from "@react-email/components";
import { EmailLayout, colors } from "./_components/email-layout";
import { t } from "./_components/translator";

export type TransactionalEmailProps = {
  preview: string;
  greeting: string;
  /** A paragraph, or a smaller one (dates, details). */
  paragraphs: (string | { text: string; small: true })[];
  /** One-time code shown large (verification e-mails). */
  code?: string;
  /** Highlighted item after the first paragraph: an offer, an interview (mockup 08-06). */
  card?: { initials: string; title: string; meta: string };
  cta?: { label: string; href: string };
  footnote?: string;
  /** Lime illustrated band at the top (welcome e-mails). */
  hero?: boolean;
  /** Security and account e-mails cannot be turned off; the others link to the preferences. */
  essential?: boolean;
  /** Filled in when sending: the address shown in the footer. */
  recipient?: string;
  /**
   * Head of the recruitment e-mails (recruteur lot 6, docs/refonte-mobile/modeles-recruteur): a
   * badge, a big title and a line, above the greeting.
   */
  banner?: { badge: string; title: string; sub: string; tone: "lime" | "creme" | "ambre" };
  /** Three figures in a row (end of an offer: applications, views, interviews). */
  figures?: { value: string; label: string }[];
  /** Numbered steps after the card (« Les prochaines étapes »), in a cream box when `boxed`. */
  steps?: { title?: string; boxed?: boolean; items: { title: string; text: string }[] };
  /** Paragraphs after the button (the sign-off of a recruiter's letter). */
  closing?: string[];
};

const stepTones = [colors.lime, "#C8F0E2", "#FBE3B0"];
const badgeTones = { lime: colors.lime, creme: "#E8E2D8", ambre: "#FBE3B0" };

const paragraph = { fontSize: 15, lineHeight: "24px", color: colors.sapin, margin: "0 0 16px" };
const small = { ...paragraph, fontSize: 12, lineHeight: "17px" };
const muted = { ...paragraph, fontSize: 11, lineHeight: "15px", color: colors.ardoise };

/** Initials of an organization for the card tile (« Baobab Fintech » → « BF »). */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/**
 * Generic e-mail (mockup 08-06): texts come already translated from `mail.*` (textes, partie 07),
 * so this frame holds no wording of its own.
 */
export default function TransactionalEmail({
  preview,
  greeting,
  paragraphs,
  code,
  card,
  cta,
  footnote,
  hero,
  essential = true,
  recipient,
  banner,
  figures,
  steps,
  closing,
}: TransactionalEmailProps) {
  const blocks = paragraphs.map((item, index) =>
    typeof item === "string" ? (
      <Text key={index} style={paragraph}>
        {item}
      </Text>
    ) : (
      <Text key={index} style={small}>
        {item.text}
      </Text>
    ),
  );
  return (
    <EmailLayout preview={preview} recipient={recipient} essential={essential} hero={hero}>
      {banner && (
        <Section style={{ margin: "0 0 18px" }}>
          <Text
            style={{
              display: "inline-block",
              margin: "0 0 12px",
              padding: "5px 11px",
              borderRadius: 99,
              backgroundColor: badgeTones[banner.tone],
              color: colors.sapin,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {banner.badge}
          </Text>
          <Text style={{ margin: "0 0 6px", fontSize: 24, lineHeight: "30px", fontWeight: 700 }}>
            {banner.title}
          </Text>
          <Text style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: colors.ardoise }}>
            {banner.sub}
          </Text>
        </Section>
      )}
      <Text style={paragraph}>{greeting}</Text>
      {blocks[0]}
      {card && (
        <Section
          style={{
            backgroundColor: colors.creme,
            borderRadius: 18,
            padding: "14px 16px",
            margin: "0 0 16px",
          }}
        >
          <Row>
            <Column style={{ width: 56 }}>
              <Text
                style={{
                  margin: 0,
                  width: 44,
                  height: 44,
                  lineHeight: "44px",
                  borderRadius: 13,
                  backgroundColor: colors.sapin,
                  color: colors.lime,
                  fontSize: 15,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {card.initials}
              </Text>
            </Column>
            <Column>
              <Text style={{ margin: 0, fontSize: 15, lineHeight: "22px", fontWeight: 600 }}>
                {card.title}
              </Text>
              <Text style={{ margin: 0, fontSize: 12, lineHeight: "17px", color: colors.ardoise }}>
                {card.meta}
              </Text>
            </Column>
          </Row>
        </Section>
      )}
      {figures && figures.length > 0 && (
        <Section style={{ backgroundColor: colors.creme, borderRadius: 16, margin: "0 0 16px" }}>
          <Row>
            {figures.map((item, index) => (
              <Column
                key={index}
                align="center"
                style={{
                  padding: "14px 8px",
                  borderLeft: index === 0 ? undefined : `1px solid ${colors.brume}`,
                }}
              >
                <Text style={{ margin: 0, fontSize: 22, lineHeight: "28px", fontWeight: 700 }}>
                  {item.value}
                </Text>
                <Text
                  style={{ margin: 0, fontSize: 12, lineHeight: "16px", color: colors.ardoise }}
                >
                  {item.label}
                </Text>
              </Column>
            ))}
          </Row>
        </Section>
      )}
      {blocks.slice(1)}
      {steps && steps.items.length > 0 && (
        <Section
          style={
            steps.boxed
              ? {
                  backgroundColor: colors.creme,
                  borderRadius: 16,
                  padding: "14px 18px",
                  margin: "0 0 16px",
                }
              : { margin: "0 0 16px" }
          }
        >
          {steps.title && (
            <Text style={{ ...paragraph, margin: "0 0 8px", fontWeight: 700 }}>{steps.title}</Text>
          )}
          {steps.items.map((item, index) => (
            <Row key={index} style={{ margin: "8px 0" }}>
              <Column style={{ width: 38, verticalAlign: "top" }}>
                <Text
                  style={{
                    margin: 0,
                    width: 26,
                    height: 26,
                    lineHeight: "26px",
                    borderRadius: 13,
                    backgroundColor: stepTones[index % 3],
                    color: colors.sapin,
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </Text>
              </Column>
              <Column>
                <Text style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>
                  {item.title}
                </Text>
                <Text
                  style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: colors.ardoise }}
                >
                  {item.text}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>
      )}
      {code && (
        <Text
          style={{
            ...paragraph,
            fontSize: 32,
            lineHeight: "40px",
            fontWeight: 600,
            letterSpacing: 8,
            textAlign: "center",
          }}
        >
          {code}
        </Text>
      )}
      {cta && (
        <>
          <Button
            href={cta.href}
            style={{
              backgroundColor: colors.lime,
              color: colors.sapin,
              borderRadius: 999,
              padding: "15px 24px",
              fontSize: 14,
              lineHeight: "18px",
              fontWeight: 600,
              margin: "0 0 16px",
            }}
          >
            {cta.label}
          </Button>
          <Text style={muted}>{t("mail.common.buttonFallback", { url: cta.href })}</Text>
        </>
      )}
      {closing?.map((item, index) => (
        <Text key={`c${index}`} style={paragraph}>
          {item}
        </Text>
      ))}
      {footnote && <Text style={{ ...muted, fontSize: 13, lineHeight: "20px" }}>{footnote}</Text>}
    </EmailLayout>
  );
}

// Preview data for `pnpm email:dev` only (obviously fictional).
TransactionalEmail.PreviewProps = {
  preview: t("mail.verifyCode.preheader", { minutes: 15 }),
  greeting: t("mail.common.greeting.text", { firstName: t("foundation.sampleFirstName") }),
  paragraphs: [t("mail.verifyCode.p1")],
  code: "123456",
  footnote: t("mail.verifyCode.p2", { minutes: 15 }),
  recipient: t("foundation.sampleEmail"),
} satisfies TransactionalEmailProps;
