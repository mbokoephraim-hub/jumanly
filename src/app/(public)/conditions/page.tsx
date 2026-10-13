import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms.seo");
  return pageMetadata({ path: "/conditions", title: t("title"), description: t("description") });
}

export default function TermsPage() {
  return <LegalPage namespace="terms" current="/conditions" />;
}
