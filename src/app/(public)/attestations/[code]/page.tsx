import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import { TalentIcon } from "@/components/talent/icon";
import { CertificateLookup } from "@/components/learn/certificate-lookup";
import { Eyebrow, Pattern, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { Skeleton } from "@/components/ui";
import { cx } from "@/lib/cx";
import { getCertificate } from "@/server/queries/public";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("certificate.verify");
  // A holder's name is shown: the page is public by its link, never indexed.
  return { title: t("title"), description: t("seo.description"), robots: { index: false } };
}

/** Public verification of an attestation (planche talent-3): authentic, modified, revoked or unknown. */
export default async function CertificateVerifyPage({ params }: PageProps<"/attestations/[code]">) {
  const t = await getTranslations("certificate.verify");
  const learn = await getTranslations("trainings.hero");
  return (
    <>
      <MotionRoot />
      <section
        data-scene
        className="relative overflow-hidden bg-creme pt-10 pb-14 lg:pt-20 lg:pb-28"
      >
        <Pattern name="motif-trajectoires-clair" size={460} opacity={0.3} />
        <div
          className={cx(wrap, "relative flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16")}
        >
          <div className="flex flex-col gap-6 lg:w-[620px] lg:shrink-0">
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow>{learn("eyebrow")}</Eyebrow>
            </div>
            <h1
              className="jm-word text-[40px] leading-[44px] font-semibold tracking-[-0.035em] lg:text-[64px] lg:leading-[66px]"
              style={stagger(1)}
            >
              {t("title")}
            </h1>
            <div className="jm-rise" style={stagger(2)}>
              <Suspense fallback={<Skeleton className="h-[480px] rounded-[32px]" />}>
                <Verification params={params} />
              </Suspense>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6 lg:pt-[44px]">
            <div className="jm-rise" style={stagger(3)}>
              <CertificateLookup />
            </div>
            <Link
              href="/formations"
              className="jm-rise inline-flex items-center gap-1.5 self-start text-[15px] font-semibold text-feuille-fonce hover:underline"
              style={stagger(4)}
            >
              {t("cta")}
              <Icon name="chev-r" className="size-4" />
            </Link>
            <div className="jm-breathe hidden self-end lg:block">
              <Character name="kofi" pose="joie" height={220} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * The answer of the check (planche talent-3, « Vérification publique »): authentic (the digital
 * signature matches), modified, revoked or unknown, then the holder, the course, the result and
 * the date, the number.
 */
async function Verification({ params }: { params: PageProps<"/attestations/[code]">["params"] }) {
  const { code } = await params;
  const t = await getTranslations("attest.verify");
  const format = await getFormatter();
  const { check, certificate } = await getCertificate(decodeURIComponent(code).toUpperCase());
  if (!certificate || check.state === "unknown")
    return (
      <div className="t-flux t-serre" role="status">
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
    <div className="t-flux t-serre" role="status">
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
      <dl className="t-verre t-liste t-lignes">
        {rows.map((row) => (
          <div key={row.label} className="t-li">
            <div className="t-t flex-col-reverse">
              <dd>
                <b>{row.value}</b>
              </dd>
              <dt>
                <span>{row.label}</span>
              </dt>
            </div>
          </div>
        ))}
      </dl>
      <p className="t-v-ko">
        <TalentIcon name="aide" size="s" />
        <span>{t("warning")}</span>
      </p>
    </div>
  );
}
