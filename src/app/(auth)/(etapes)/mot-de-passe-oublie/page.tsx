import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading, AuthNote } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forms";
import { Icon } from "@/components/brand/icon";
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

/** Forgotten password (mockup 02-02). */
export default async function ForgotPage() {
  const t = await getTranslations("forgot");
  return (
    <AuthCard className="jm-rise lg:pt-20">
      <AuthHeading icon="lock" title={t("title")} subtitle={t("subtitle")} />
      <ForgotForm />
      <AuthNote icon="securite">{t("googleHint")}</AuthNote>
      <Link
        href="/connexion"
        className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-sapin hover:underline"
      >
        <Icon name="chev-l" className="size-4" />
        {t("back")}
      </Link>
    </AuthCard>
  );
}
