import { Suspense } from "react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { getCertificate } from "@/server/queries/public";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("certificate.verify");
  // A holder's name is shown: the page is public by its link, never indexed.
  return { title: t("title"), description: t("seo.description"), robots: { index: false } };
}

/**
 * Public check of an attestation (planche web talent-3 § 8, mobile talent-3 « Vérification
 * publique »): authentic (the digital signature matches), modified, revoked or unknown; then the
 * holder, the course, the result and the date, the number, and the drawing beside them on a large
 * screen (authentic attestations only).
 */
export default function CertificateVerifyPage({ params }: PageProps<"/attestations/[code]">) {
  // The address is read at request time: the answer streams in, the frame is drawn at once.
  return (
    <Suspense fallback={<div className="t-verre t-v-ok t-vpub-attente" aria-busy="true" />}>
      <Verification params={params} />
    </Suspense>
  );
}

async function Verification({ params }: { params: PageProps<"/attestations/[code]">["params"] }) {
  const { code } = await params;
  const t = await getTranslations("attest.verify");
  const title = await getTranslations("certificate.verify");
  const format = await getFormatter();
  const { check, certificate } = await getCertificate(decodeURIComponent(code).toUpperCase());
  if (!certificate || check.state === "unknown")
    return (
      <div className="t-flux" role="status">
        <h1 className="sr-only">{title("title")}</h1>
        <div className="t-verre t-v-ko t-v-inconnue">
          <TalentIcon name="recherche" size="s" />
          <span>
            <b>{t("unknown.title")}</b> {t("unknown.text")}
          </span>
        </div>
      </div>
    );
  const date = format.dateTime(certificate.issuedAt, { dateStyle: "long", timeZone: "UTC" });
  const rows = [
    { label: t("holder"), value: certificate.holderName },
    {
      label: t("course"),
      value: t("courseLine", { course: certificate.courseTitle, hours: certificate.hours }),
    },
    {
      label: t("result"),
      value:
        certificate.score !== null ? t("resultLine", { score: certificate.score, date }) : date,
    },
    { label: t("number"), value: certificate.code },
  ];
  const state = check.state;
  return (
    <div className="t-flux" role="status">
      <h1 className="sr-only">{title("title")}</h1>
      {state === "authentic" ? (
        <div className="t-verre t-v-ok">
          <span className="t-rond-ok" aria-hidden>
            <TalentIcon name="valider" />
          </span>
          <h2>{t("authentic.title")}</h2>
          <p>
            {check.state === "authentic" && check.signature === "valid"
              ? t("authentic.text")
              : t("authentic.textUnsigned")}
          </p>
        </div>
      ) : (
        <div className="t-verre t-v-ok t-v-alerte">
          <span className="t-rond-ok" aria-hidden>
            <TalentIcon name="fermer" />
          </span>
          <h2>{state === "revoked" ? t("revoked.title") : t("modified.title")}</h2>
          <p>
            {state === "revoked"
              ? t("revoked.text", {
                  date: format.dateTime(certificate.revokedAt!, {
                    dateStyle: "long",
                    timeZone: "UTC",
                  }),
                })
              : t("modified.text")}
          </p>
        </div>
      )}
      <div className="t-vpub-vv">
        <dl className="t-verre t-liste t-lignes">
          {rows.map((row) => (
            <div key={row.label} className="t-li">
              <div className="t-t">
                <dt>
                  <span>{row.label}</span>
                </dt>
                <dd>
                  <b>{row.value}</b>
                </dd>
              </div>
            </div>
          ))}
        </dl>
        {check.state === "authentic" && check.signature === "valid" && (
          // eslint-disable-next-line @next/next/no-img-element -- drawn on the server, per attestation
          <img
            src={`/attestations/${encodeURIComponent(certificate.code)}/apercu`}
            alt=""
            width={1123}
            height={794}
            decoding="async"
            className="t-ap-web"
          />
        )}
      </div>
      <p className="t-v-ko">
        <TalentIcon name="aide" size="s" />
        <span>{t("warning")}</span>
      </p>
    </div>
  );
}
