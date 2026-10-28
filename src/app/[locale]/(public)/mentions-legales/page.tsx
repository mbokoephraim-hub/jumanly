import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/mentions-legales">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("notice.seo");
  return pageMetadata({
    path: "/mentions-legales",
    title: t("title"),
    description: t("description"),
  });
}

export default async function LegalNoticePage({ params }: PageProps<"/[locale]/mentions-legales">) {
  await applySiteLocale(params);
  return <LegalPage namespace="notice" current="/mentions-legales" />;
}
