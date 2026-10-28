import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/confidentialite">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("privacy.seo");
  return pageMetadata({
    path: "/confidentialite",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/confidentialite">) {
  await applySiteLocale(params);
  return <LegalPage namespace="privacy" current="/confidentialite" />;
}
