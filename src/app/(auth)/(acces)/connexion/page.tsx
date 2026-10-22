import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessHead, ProviderButtons } from "@/components/access/frame";
import { LoginForm } from "@/components/access/forms";
import { TalentIcon } from "@/components/talent/icon";
import { pageMetadata } from "@/lib/seo";
import { readSignupParams } from "@/lib/signup-params";
import { signInWithProvider } from "@/server/actions/auth";
import { enabledProviders } from "@/server/auth";
import { getSession } from "@/server/auth/session";
import { isPhone } from "@/server/view";
import { PhoneLoginPage } from "@/components/phone/accueil/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login.seo");
  return pageMetadata({
    path: "/connexion",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

/** « Bon retour » (planche talent-4, connexion). `?suite=` brings the person back to their action. */
export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <Suspense fallback={null}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const params = await searchParams;
  const { suite } = readSignupParams(params);
  if (await getSession()) redirect(suite ?? "/app");
  const t = await getTranslations();
  const providers = enabledProviders().map((id) => ({
    id,
    label: t(`access.provider.${id}`),
    short: t(`access.providerShort.${id}`),
  }));
  const notice = (tone: "ok" | "err", text: string) => (
    <p role="status" className={`t-gar t-${tone}`}>
      <TalentIcon name={tone === "ok" ? "valider" : "aide"} size="s" />
      {text}
    </p>
  );
  const failed = ["google", "apple", "linkedin"].find((id) => params.erreur === id);
  if (await isPhone()) {
    const notices: { tone: "ok" | "err"; text: string }[] = [];
    if (params.deconnecte) notices.push({ tone: "ok", text: t("auth.success.logout") });
    if (params.suppression) notices.push({ tone: "ok", text: t("login.deleted") });
    if (failed) notices.push({ tone: "err", text: t(`auth.error.${failed as "google"}Failed`) });
    if (suite) notices.push({ tone: "ok", text: t("auth.resume.generic") });
    return <PhoneLoginPage next={suite} notices={notices} />;
  }
  return (
    <>
      <AccessHead
        brand={t("access.brand")}
        homeLabel={t("access.home")}
        title={t("access.login.title")}
        subtitle={t("access.login.subtitle")}
      />
      {params.deconnecte && notice("ok", t("auth.success.logout"))}
      {params.suppression && notice("ok", t("login.deleted"))}
      {failed && notice("err", t(`auth.error.${failed as "google"}Failed`))}
      {suite && notice("ok", t("auth.resume.generic"))}
      <LoginForm
        next={suite}
        providers={
          providers.length > 0 ? (
            <div className="t-duo-f">
              <ProviderButtons providers={providers} action={signInWithProvider} />
            </div>
          ) : undefined
        }
      />
      <p className="t-mention">
        {t("access.login.noAccount")}{" "}
        <Link href={suite ? `/inscription?${new URLSearchParams({ suite })}` : "/inscription"}>
          {t("access.login.signup")}
        </Link>
        <br />
        <Link href="/activer">{t("access.login.licence")}</Link>
      </p>
    </>
  );
}
