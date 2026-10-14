import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CertificateLookup } from "@/components/learn/certificate-lookup";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("certificate.verify");
  return pageMetadata({
    path: "/attestations",
    title: t("title"),
    description: t("seo.description"),
  });
}

/** Verification form: the number printed on an attestation leads to its public page. */
export default async function CertificateLookupPage() {
  const t = await getTranslations("certificate.verify");
  return (
    <section className="bg-creme">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 page-x py-12 md:py-16">
        <h1 className="text-display">{t("title")}</h1>
        <p className="text-lg leading-8 text-ardoise">{t("intro")}</p>
        <CertificateLookup />
      </div>
    </section>
  );
}
