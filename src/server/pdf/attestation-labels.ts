import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Certificate } from "@/generated/prisma/client";
import { siteUrl } from "@/lib/seo";
import { fingerprint } from "@/server/services/certificate-signature";
import { attestationSvg, escapeXml } from "./attestation-sheet";

/** The drawing of an attestation, with the texts of `attest.sheet` (signed attestations only). */
type Drawn = Pick<
  Certificate,
  | "code"
  | "signedAt"
  | "issuedAt"
  | "domain"
  | "hours"
  | "modules"
  | "courseTitle"
  | "skills"
  | "score"
  | "holderName"
> & { signature: string };

export async function attestationDrawing(
  certificate: Drawn,
  { light = false }: { light?: boolean } = {},
) {
  const t = await getTranslations("attest.sheet");
  const format = await getFormatter();
  const verifyUrl = `${siteUrl()}/attestations/${certificate.code}`;
  const print = fingerprint(certificate.signature);
  const signedAt = certificate.signedAt ?? certificate.issuedAt;
  const day = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const details = [
    certificate.domain,
    t("hours", { count: certificate.hours }),
    certificate.modules ? t("modules", { count: certificate.modules }) : null,
  ]
    .filter(Boolean)
    .join(", ");
  const bold = (chunks: string) => `<b>${chunks}</b>`;
  const course = t.markup("body.course", {
    course: escapeXml(certificate.courseTitle),
    details: escapeXml(details),
    b: bold,
  });
  const skills = certificate.skills.length > 0 ? ` ${t("body.skills")}` : "";
  const body =
    certificate.score !== null
      ? `${course},<br/>${t.markup("body.score", { score: certificate.score, b: bold })}${skills}`
      : `${course}.${skills ? `<br/>${skills.trim()}` : ""}`;
  return attestationSvg(
    {
      code: certificate.code,
      holder: certificate.holderName,
      fingerprint: print.full,
      fingerprintShort: print.short,
      verifyUrl,
      skills: certificate.skills,
    },
    {
      number: t("number", { code: certificate.code }),
      delivered: t("delivered", { date: day(certificate.issuedAt) }),
      title: t("title"),
      subtitle: t("subtitle"),
      intro: t("intro"),
      body,
      signer: t("signer"),
      signedOn: t("signedOn", {
        date: day(signedAt),
        time: format.dateTime(signedAt, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
      }),
      fingerprint: t("fingerprint", { value: print.short }),
      verifyTitle: t("verifyTitle"),
      verifyText: t("verifyText"),
      footer: t("footer"),
      micro: `${t("micro", { code: certificate.code })} `,
      seal: t("seal"),
    },
    { light },
  );
}

/** Number shown on a specimen: the format of a real number, never a real one. */
export const SPECIMEN_CODE = "JMN-XXXX-XXXX";

/**
 * A specimen of the attestation of a course, at the talent's name (planche web talent-3 § 2-3:
 * « L'attestation » next to « Commencer »). Its number is the format only, so it verifies nothing.
 */
export function specimenDrawing(course: {
  holderName: string;
  courseTitle: string;
  domain: string | null;
  hours: number;
  modules: number;
  skills: string[];
}) {
  const now = new Date();
  return attestationDrawing(
    {
      ...course,
      code: SPECIMEN_CODE,
      signature: `specimen:${course.courseTitle}`,
      signedAt: now,
      issuedAt: now,
      score: null,
    },
    { light: true },
  );
}
