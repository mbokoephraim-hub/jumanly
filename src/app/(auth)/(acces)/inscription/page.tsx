import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessHead, ProviderButtons } from "@/components/access/frame";
import { TalentIcon } from "@/components/talent/icon";
import { interpolate, slot } from "@/lib/interpolate";
import { pageMetadata } from "@/lib/seo";
import { readSignupParams, stepHref } from "@/lib/signup-params";
import { signInWithProvider } from "@/server/actions/auth";
import { enabledProviders } from "@/server/auth";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { readSignupFlow } from "@/server/signup-flow";
import { isPhone } from "@/server/view";
import { PhoneSignupPage } from "@/components/phone/accueil/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.profile.seo");
  return pageMetadata({ path: "/inscription", title: t("title"), description: t("description") });
}

/**
 * « Créez votre compte » (planche talent-4 § 1): Google, LinkedIn, or the e-mail. A recruiter or a
 * company goes on to its plan step; a plan chosen on /tarifs is paid after the first questions.
 */
export default function SignupEntryPage({ searchParams }: PageProps<"/inscription">) {
  return (
    <Suspense fallback={null}>
      <SignupEntry searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupEntry({ searchParams }: Pick<PageProps<"/inscription">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (await getSession()) redirect(params.suite ?? "/app");
  if (params.profil === "partner") redirect("/partenaires#contact");
  if (params.profil === "rh" || params.profil === "company") {
    redirect(stepHref("/inscription/forfait", params));
  }
  const t = await getTranslations("access");
  const plan = params.forfait
    ? await db.plan.findFirst({
        where: { code: params.forfait, family: "talent", priceCents: { gt: 0 } },
        select: { code: true, name: true },
      })
    : null;
  if (await isPhone()) {
    return (
      <PhoneSignupPage
        plan={plan ?? undefined}
        next={params.suite}
        defaultEmail={(await readSignupFlow()).email}
      />
    );
  }
  const providers = enabledProviders().map((id) => ({ id, label: t(`provider.${id}`) }));
  const step = { profil: "talent", forfait: plan?.code, suite: params.suite };
  return (
    <>
      <AccessHead
        brand={t("brand")}
        homeLabel={t("home")}
        title={t("signup.title")}
        subtitle={t("signup.subtitle")}
      />
      {plan && (
        <p className="t-gar t-ok" role="status">
          <TalentIcon name="portefeuille" size="s" />
          {t("signup.plan", { plan: plan.name })}
        </p>
      )}
      {providers.length > 0 && (
        <form className="flex flex-col gap-3.5">
          <input type="hidden" name="profil" value="talent" />
          {plan && <input type="hidden" name="forfait" value={plan.code} />}
          {params.suite && <input type="hidden" name="next" value={params.suite} />}
          <ProviderButtons providers={providers} action={signInWithProvider} />
          <div className="t-ou">{t("or")}</div>
        </form>
      )}
      <Link href={stepHref("/inscription/compte", step)} className="t-bt t-p t-pl t-press">
        <TalentIcon name="message" size="s" />
        {t("signup.email")}
      </Link>
      <p className="t-mention">
        {interpolate(t("signup.legal", { terms: slot("terms"), privacy: slot("privacy") }), {
          terms: <Link href="/conditions">{t("signup.terms")}</Link>,
          privacy: <Link href="/confidentialite">{t("signup.privacy")}</Link>,
        })}{" "}
        {t("signup.hasAccount")}{" "}
        <Link href={stepHref("/connexion", { suite: params.suite })}>{t("signup.login")}</Link>
      </p>
      <p className="t-mention">
        {t("signup.recruiter")}{" "}
        <Link href="/inscription/forfait?profil=rh">{t("signup.recruiterLink")}</Link>
      </p>
    </>
  );
}
