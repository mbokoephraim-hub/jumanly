import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { ResetForm } from "@/components/auth/forms";
import { Alert, Skeleton } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reset");
  return pageMetadata({
    path: "/reinitialiser",
    title: t("seo.title"),
    description: t("title"),
    noindex: true,
  });
}

export default function ResetPage({ searchParams }: PageProps<"/reinitialiser">) {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] rounded-card" />}>
      <Reset searchParams={searchParams} />
    </Suspense>
  );
}

/** Better Auth sends the visitor here with `?token=…`, or `?error=INVALID_TOKEN` when expired. */
async function Reset({ searchParams }: Pick<PageProps<"/reinitialiser">, "searchParams">) {
  const params = await searchParams;
  const t = await getTranslations("reset");
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <AuthCard>
      <AuthHeading title={t("title")} />
      {token && !params.error ? (
        <ResetForm token={token} />
      ) : (
        <Alert
          tone="error"
          title={t("invalid.title")}
          action={
            <Link href="/mot-de-passe-oublie" className="font-medium underline">
              {t("invalid.cta")}
            </Link>
          }
        >
          {t("invalid.text")}
        </Alert>
      )}
    </AuthCard>
  );
}
