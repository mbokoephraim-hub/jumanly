import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { LoginForm, MagicLinkForm } from "@/components/auth/forms";
import { Alert, Button, Skeleton } from "@/components/ui";
import { DELETION_GRACE_DAYS } from "@/lib/password";
import { isSafeInternalPath } from "@/lib/signup";
import { pageMetadata } from "@/lib/seo";
import { signInWithGoogle } from "@/server/actions/auth";
import { googleEnabled } from "@/server/auth";
import { getSession } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login.seo");
  return pageMetadata({
    path: "/connexion",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-card" />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const params = await searchParams;
  const suite =
    typeof params.suite === "string" && isSafeInternalPath(params.suite) ? params.suite : undefined;
  if (await getSession()) redirect(suite ?? "/app");
  const t = await getTranslations();
  return (
    <AuthCard>
      <AuthHeading title={t("login.title")} subtitle={t("login.subtitle")} />
      {params.deconnecte && <Alert tone="success" title={t("auth.success.logout")} />}
      {params.suppression && (
        <Alert tone="warning" title={t("login.deletionScheduled", { days: DELETION_GRACE_DAYS })} />
      )}
      {params.erreur === "google" && <Alert tone="error" title={t("auth.error.googleFailed")} />}
      {suite && <Alert title={t("auth.resume.generic")} />}
      {googleEnabled && (
        <>
          <form action={signInWithGoogle}>
            {suite && <input type="hidden" name="next" value={suite} />}
            <Button type="submit" variant="secondary" fullWidth size="lg">
              {t("auth.google")}
            </Button>
          </form>
          <p className="text-center text-sm text-ardoise">{t("auth.or")}</p>
        </>
      )}
      <LoginForm next={suite} />
      <details className="rounded-md bg-creme p-4">
        <summary className="cursor-pointer font-medium">{t("login.magic.toggle")}</summary>
        <div className="mt-4">
          <MagicLinkForm next={suite} />
        </div>
      </details>
      <p className="text-sm">
        {t("login.noAccount")}{" "}
        <Link
          href={suite ? `/inscription?${new URLSearchParams({ suite })}` : "/inscription"}
          className="font-semibold underline"
        >
          {t("login.signupLink")}
        </Link>
      </p>
      <p className="text-sm text-ardoise">
        {t("auth.legal.text", { terms: t("auth.legal.terms"), privacy: t("auth.legal.privacy") })}
      </p>
    </AuthCard>
  );
}
