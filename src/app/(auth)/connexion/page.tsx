import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AuthCard,
  AuthHeading,
  AuthNote,
  GoogleButton,
  OrSeparator,
} from "@/components/auth/auth-card";
import { LoginForm, MagicLinkForm } from "@/components/auth/forms";
import { Icon } from "@/components/brand/icon";
import { Alert, Skeleton } from "@/components/ui";
import { interpolate, slot } from "@/lib/interpolate";
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
    <Suspense fallback={<Skeleton className="h-[560px] w-full max-w-[520px] rounded-card" />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

/** Sign-in (mockup 02-01). */
async function Login({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const params = await searchParams;
  const suite =
    typeof params.suite === "string" && isSafeInternalPath(params.suite) ? params.suite : undefined;
  if (await getSession()) redirect(suite ?? "/app");
  const t = await getTranslations();
  return (
    <AuthCard className="jm-rise">
      <AuthHeading title={t("login.title")} subtitle={t("login.subtitle")} />
      {params.deconnecte && <Alert tone="success" title={t("auth.success.logout")} />}
      {params.suppression && (
        <Alert tone="warning" title={t("login.deletionScheduled", { days: DELETION_GRACE_DAYS })} />
      )}
      {params.erreur === "google" && <Alert tone="error" title={t("auth.error.googleFailed")} />}
      {suite && (
        <AuthNote icon="jobs" tone="menthe">
          {t("auth.resume.generic")}
        </AuthNote>
      )}
      {googleEnabled && (
        <>
          <form action={signInWithGoogle}>
            {suite && <input type="hidden" name="next" value={suite} />}
            <GoogleButton label={t("auth.google")} />
          </form>
          <OrSeparator />
        </>
      )}
      <LoginForm next={suite} />
      <details className="group">
        <summary className="flex h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-pill text-sm font-semibold ring-[1.5px] ring-brume ring-inset group-open:mb-4 hover:bg-blanc [&::-webkit-details-marker]:hidden">
          <Icon name="message" className="size-[18px]" />
          {t("login.magic.toggle")}
        </summary>
        <div className="rounded-[20px] bg-blanc p-5">
          <MagicLinkForm next={suite} />
        </div>
      </details>
      <div className="flex flex-col items-center gap-3 border-t border-brume pt-6 text-center text-[13px]">
        <p className="text-sapin">
          {t("login.noAccount")}{" "}
          <Link
            href={suite ? `/inscription?${new URLSearchParams({ suite })}` : "/inscription"}
            className="font-semibold text-feuille-fonce hover:underline"
          >
            {t("login.signupLink")}
          </Link>
        </p>
        <Link
          href="/activer"
          className="flex items-center gap-2 font-semibold text-sapin hover:underline"
        >
          <Icon name="certificat" className="size-4 text-feuille-fonce" />
          {t("login.partnerCode")}
        </Link>
        <p className="text-xs leading-[17px] text-ardoise">
          {interpolate(t("auth.legal.text", { terms: slot("terms"), privacy: slot("privacy") }), {
            terms: (
              <Link href="/conditions" className="underline">
                {t("auth.legal.terms")}
              </Link>
            ),
            privacy: (
              <Link href="/confidentialite" className="underline">
                {t("auth.legal.privacy")}
              </Link>
            ),
          })}
        </p>
      </div>
    </AuthCard>
  );
}
