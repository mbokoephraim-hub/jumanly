import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { TwoFactorForm } from "@/components/auth/forms";
import { Skeleton } from "@/components/ui";
import { CODE_DIGITS } from "@/lib/password";
import { isSafeInternalPath } from "@/lib/signup";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login.twoFactor");
  return pageMetadata({
    path: "/connexion/deux-etapes",
    title: t("seo"),
    description: t("text", { digits: CODE_DIGITS }),
    noindex: true,
  });
}

export default function TwoFactorPage({ searchParams }: PageProps<"/connexion/deux-etapes">) {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] rounded-card" />}>
      <TwoFactor searchParams={searchParams} />
    </Suspense>
  );
}

async function TwoFactor({
  searchParams,
}: Pick<PageProps<"/connexion/deux-etapes">, "searchParams">) {
  const params = await searchParams;
  const suite =
    typeof params.suite === "string" && isSafeInternalPath(params.suite) ? params.suite : undefined;
  const t = await getTranslations("login.twoFactor");
  return (
    <AuthCard>
      <AuthHeading title={t("title")} subtitle={t("text", { digits: CODE_DIGITS })} />
      <TwoFactorForm next={suite} />
    </AuthCard>
  );
}
