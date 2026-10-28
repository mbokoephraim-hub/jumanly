import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/conditions">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("terms.seo");
  return pageMetadata({ path: "/conditions", title: t("title"), description: t("description") });
}

export default async function TermsPage({ params }: PageProps<"/[locale]/conditions">) {
  await applySiteLocale(params);
  return <LegalPage namespace="terms" current="/conditions" />;
}
