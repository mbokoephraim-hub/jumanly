import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("cookiesPolicy.seo");
  return pageMetadata({ path: "/cookies", title: t("title"), description: t("description") });
}

export default async function CookiesPage({ params }: PageProps<"/[locale]/cookies">) {
  await applySiteLocale(params);
  return <LegalPage namespace="cookiesPolicy" current="/cookies" />;
}
