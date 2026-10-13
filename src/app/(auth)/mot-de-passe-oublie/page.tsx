import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forms";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forgot.seo");
  return pageMetadata({
    path: "/mot-de-passe-oublie",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function ForgotPage() {
  const t = await getTranslations("forgot");
  return (
    <AuthCard>
      <AuthHeading title={t("title")} subtitle={t("subtitle")} />
      <ForgotForm />
      <p className="text-sm text-ardoise">{t("googleHint")}</p>
      <Link href="/connexion" className="text-sm font-semibold underline">
        {t("back")}
      </Link>
    </AuthCard>
  );
}
