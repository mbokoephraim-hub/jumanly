import { Button, Text } from "@react-email/components";
import { EmailLayout } from "./_components/email-layout";
import { t } from "./_components/translator";

export type TransactionalEmailProps = {
  preview: string;
  greeting: string;
  paragraphs: string[];
  /** One-time code shown large (verification e-mails). */
  code?: string;
  cta?: { label: string; href: string };
  footnote?: string;
};

const paragraph = { fontSize: 16, lineHeight: "26px", color: "#0F3F37" };

/**
 * Generic account e-mail (verification code, links, receipts): texts come already translated from
 * `mail.*` (textes, partie 07), so this frame holds no wording of its own.
 */
export default function TransactionalEmail({
  preview,
  greeting,
  paragraphs,
  code,
  cta,
  footnote,
}: TransactionalEmailProps) {
  return (
    <EmailLayout preview={preview}>
      <Text style={{ ...paragraph, marginTop: 0 }}>{greeting}</Text>
      {paragraphs.map((text, index) => (
        <Text key={index} style={paragraph}>
          {text}
        </Text>
      ))}
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
              backgroundColor: "#0F3F37",
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "12px 24px",
              fontWeight: 500,
            }}
          >
            {cta.label}
          </Button>
          <Text style={{ ...paragraph, fontSize: 13, lineHeight: "20px", color: "#5B6B68" }}>
            {t("mail.common.buttonFallback", { url: cta.href })}
          </Text>
        </>
      )}
      {footnote && (
        <Text style={{ ...paragraph, fontSize: 13, lineHeight: "20px", color: "#5B6B68" }}>
          {footnote}
        </Text>
      )}
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
} satisfies TransactionalEmailProps;
