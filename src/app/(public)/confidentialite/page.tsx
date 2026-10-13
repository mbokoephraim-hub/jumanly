import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy.seo");
  return pageMetadata({
    path: "/confidentialite",
    title: t("title"),
    description: t("description"),
  });
}

export default function PrivacyPage() {
  return <LegalPage namespace="privacy" current="/confidentialite" />;
}
