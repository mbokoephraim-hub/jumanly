import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cookiesPolicy.seo");
  return pageMetadata({ path: "/cookies", title: t("title"), description: t("description") });
}

export default function CookiesPage() {
  return <LegalPage namespace="cookiesPolicy" current="/cookies" />;
}
