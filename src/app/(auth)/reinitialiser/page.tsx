import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { ResetForm, ResetLinkInvalid } from "@/components/auth/forms";
import { Skeleton } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { db } from "@/server/db";
import { resetLinkEmail } from "@/server/services/accounts";

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
    <Suspense fallback={<Skeleton className="h-[420px] w-full max-w-[520px] rounded-card" />}>
      <Reset searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * New password (mockup 02-03). Better Auth sends the visitor here with `?token=…`, or
 * `?error=INVALID_TOKEN` when expired.
 */
async function Reset({ searchParams }: Pick<PageProps<"/reinitialiser">, "searchParams">) {
  const params = await searchParams;
  const t = await getTranslations("reset");
  const token = typeof params.token === "string" ? params.token.slice(0, 200) : "";
  const email = token && !params.error ? await resetLinkEmail(db, token) : null;
  return (
    <AuthCard className="jm-rise lg:pt-16">
      <AuthHeading
        icon="securite"
        title={t("title")}
        subtitle={email ? t("subtitle", { email }) : undefined}
      />
      {email ? <ResetForm token={token} /> : <ResetLinkInvalid />}
    </AuthCard>
  );
}
