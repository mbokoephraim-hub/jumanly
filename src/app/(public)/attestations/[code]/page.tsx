import { Suspense } from "react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { CertificateLookup } from "@/components/learn/certificate-lookup";
import { Badge, ButtonLink, Skeleton } from "@/components/ui";
import { getCertificate } from "@/server/queries/public";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("certificate.verify");
  // A holder's name is shown: the page is public by its link, never indexed.
  return { title: t("title"), description: t("seo.description"), robots: { index: false } };
}

/** Public verification of an attestation (partie 07): valid, revoked or unknown. */
export default async function CertificateVerifyPage({ params }: PageProps<"/attestations/[code]">) {
  const t = await getTranslations("certificate.verify");
  return (
    <section className="bg-creme">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 page-x py-12 md:py-16">
        <h1 className="text-display">{t("title")}</h1>
        <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
          <Verification params={params} />
        </Suspense>
        <p className="text-sm text-ardoise">{t("privacy")}</p>
        <CertificateLookup />
        <ButtonLink href="/formations" variant="secondary" className="self-start">
          {t("cta")}
        </ButtonLink>
      </div>
    </section>
  );
}

async function Verification({ params }: { params: PageProps<"/attestations/[code]">["params"] }) {
  const { code } = await params;
  const t = await getTranslations("certificate.verify");
  const card = await getTranslations("learn.card");
  const format = await getFormatter();
  const certificate = await getCertificate(decodeURIComponent(code).toUpperCase());
  if (!certificate) {
    return (
      <div className="flex flex-col gap-2 rounded-card bg-blanc p-6" role="status">
        <h2 className="text-h2">{t("notFound.title")}</h2>
        <p className="text-[15px] leading-6">{t("notFound.body")}</p>
      </div>
    );
  }
  const rows = [
    [t("holder"), certificate.holderName],
    [t("course"), certificate.courseTitle],
    [t("duration"), card("duration.text", { hours: certificate.hours })],
    [t("issued"), format.dateTime(certificate.issuedAt, { dateStyle: "long", timeZone: "UTC" })],
    [t("code"), certificate.code],
  ];
  return (
    <div className="flex flex-col gap-4 rounded-card bg-blanc p-6" role="status">
      <Badge tone={certificate.revokedAt ? "error" : "success"} className="self-start">
        {certificate.revokedAt ? t("revoked.badge") : t("valid.badge")}
      </Badge>
      <p className="text-[15px] leading-6">
        {certificate.revokedAt
          ? t("revoked.body", { date: certificate.revokedAt })
          : t("valid.body")}
      </p>
      <dl className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-semibold">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
