import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessHead, ProviderButtons } from "@/components/access/frame";
import { LoginForm } from "@/components/access/forms";
import { TalentIcon } from "@/components/talent/icon";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
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

/** « Se connecter » as a talent or as a recruiter, keeping the interrupted action. */
function choiceHref(recruiter: boolean, suite?: string) {
  const query = new URLSearchParams({
    ...(recruiter ? { profil: "rh" } : {}),
    ...(suite ? { suite } : {}),
  }).toString();
  return query ? `/connexion?${query}` : "/connexion";
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
  const recruiter = params.profil === "rh";
  if (await isPhone()) {
    const notices: { tone: "ok" | "err"; text: string }[] = [];
    if (params.deconnecte) notices.push({ tone: "ok", text: t("auth.success.logout") });
    if (params.suppression) notices.push({ tone: "ok", text: t("login.deleted") });
    if (params.confirmee) notices.push({ tone: "ok", text: t("login.confirmed") });
    if (params.lien) notices.push({ tone: "err", text: t("login.linkExpired") });
    if (failed) notices.push({ tone: "err", text: t(`auth.error.${failed as "google"}Failed`) });
    if (suite) notices.push({ tone: "ok", text: t("auth.resume.generic") });
    return <PhoneLoginPage next={suite} notices={notices} recruiter={recruiter} />;
  }
  return (
    <>
      <AccessHead
        brand={t("access.brand")}
        homeLabel={t("access.home")}
        title={t("access.login.title")}
        subtitle={t("access.login.subtitle")}
      />
      {/* Talent or recruiter, then « Se connecter » or « S'inscrire » (27/10/2026). */}
      <nav
        aria-label={t("access.login.who")}
        className="grid grid-cols-2 gap-1 rounded-full bg-sapin/8 p-1"
      >
        {[false, true].map((item) => (
          <Link
            key={String(item)}
            href={choiceHref(item, suite)}
            replace
            aria-current={recruiter === item ? "page" : undefined}
            className={
              recruiter === item
                ? "flex min-h-11 items-center justify-center rounded-full bg-sapin text-[15px] font-semibold text-blanc"
                : "flex min-h-11 items-center justify-center rounded-full text-[15px] font-semibold text-sapin hover:bg-sapin/8"
            }
          >
            {t(item ? "access.login.recruiter" : "access.login.talent")}
          </Link>
        ))}
      </nav>
      {params.deconnecte && notice("ok", t("auth.success.logout"))}
      {params.suppression && notice("ok", t("login.deleted"))}
      {params.confirmee && notice("ok", t("login.confirmed"))}
      {params.lien && notice("err", t("login.linkExpired"))}
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
      <Link
        href={signupHref({ profil: recruiter ? "rh" : "talent", suite })}
        className="t-bt t-sec t-pl t-press"
      >
        {t("access.login.signupButton")}
      </Link>
      <p className="t-mention">
        <Link href="/activer">{t("access.login.licence")}</Link>
      </p>
    </>
  );
}
