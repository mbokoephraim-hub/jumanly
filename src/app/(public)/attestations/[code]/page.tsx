import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
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

/** Public verification of an attestation (mockup 01-15): valid, revoked or unknown. */
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

async function Verification({ params }: { params: PageProps<"/attestations/[code]">["params"] }) {
  const { code } = await params;
  const t = await getTranslations("certificate.verify");
  const card = await getTranslations("learn.card");
  const format = await getFormatter();
  const certificate = await getCertificate(decodeURIComponent(code).toUpperCase());
  const shell =
    "flex flex-col gap-4 rounded-[28px] bg-blanc p-6 shadow-[0_24px_60px_rgba(15,63,55,0.12)] lg:rounded-[32px] lg:px-10 lg:py-9";
  if (!certificate) {
    return (
      <div className={shell} role="status">
        <div className="flex items-start gap-4 rounded-[22px] px-4 py-4 ring-[1.5px] ring-brume ring-inset">
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-creme">
            <Icon name="recherche" className="size-6" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold">{t("notFound.title")}</h2>
            <p className="text-sm leading-5">{t("notFound.body")}</p>
          </div>
        </div>
      </div>
    );
  }
  const revoked = certificate.revokedAt !== null;
  const rows = [
    { label: t("holder"), value: certificate.holderName },
    { label: t("course"), value: certificate.courseTitle },
    { label: t("duration"), value: card("duration.text", { hours: certificate.hours }) },
    {
      label: t("issued"),
      value: format.dateTime(certificate.issuedAt, { dateStyle: "long", timeZone: "UTC" }),
    },
    { label: t("code"), value: certificate.code, mono: true },
  ];
  return (
    <div className={shell} role="status">
      <div
        className={cx(
          "flex items-center gap-4 rounded-[22px] px-[18px] py-4",
          revoked ? "bg-down-fond" : "bg-[#E4FAD0]",
        )}
      >
        <span
          className={cx(
            "jm-pop flex size-[52px] shrink-0 items-center justify-center rounded-full text-blanc",
            revoked ? "bg-down-texte" : "bg-feuille-fonce",
          )}
        >
          <Icon name={revoked ? "fermer" : "check"} className="size-6" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2
            className={cx("text-lg font-semibold", revoked ? "text-down-texte" : "text-up-texte")}
          >
            {revoked ? t("revoked.badge") : t("valid.badge")}
          </h2>
          <p className="text-sm leading-5">
            {revoked ? t("revoked.body", { date: certificate.revokedAt! }) : t("valid.body")}
          </p>
        </div>
      </div>
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-0.5 border-t border-brume py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <dt className="text-sm text-ardoise">{row.label}</dt>
            <dd
              className={cx(
                "text-base font-semibold sm:text-right",
                row.mono && "font-mono tracking-[0.04em]",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="flex items-start gap-2.5 rounded-[16px] bg-creme px-3.5 py-3 text-[13px] leading-[19px] text-ardoise">
        <Icon name="lock" className="mt-px size-4 shrink-0" />
        {t("privacy")}
      </p>
    </div>
  );
}
