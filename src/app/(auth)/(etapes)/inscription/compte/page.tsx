import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AuthCard,
  AuthHeading,
  OrSeparator,
  SignupFooter,
  SignupStepper,
} from "@/components/auth/auth-card";
import { SignupAccountForm } from "@/components/auth/forms";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Icon } from "@/components/brand/icon";
import { Skeleton } from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { readSignupParams, stepHref } from "@/lib/signup-params";
import { signInWithProvider } from "@/server/actions/auth";
import { enabledProviders } from "@/server/auth";
import { getSession } from "@/server/auth/session";
import { readSignupFlow } from "@/server/signup-flow";
import { getPublicPlans } from "@/server/queries/public";
import { familiesForProfile } from "@/server/services/accounts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.account");
  return pageMetadata({
    path: "/inscription/compte",
    title: t("seo.title"),
    description: t("title"),
    noindex: true,
  });
}

export default function SignupAccountPage({ searchParams }: PageProps<"/inscription/compte">) {
  return (
    <Suspense fallback={<Skeleton className="h-[820px] rounded-card" />}>
      <AccountStep searchParams={searchParams} />
    </Suspense>
  );
}

/** Step 3 · account. Providers are offered to talents here (an organization needs its name). */
async function AccountStep({
  searchParams,
}: Pick<PageProps<"/inscription/compte">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (!params.profil || params.profil === "partner") redirect(stepHref("/inscription", params));
  if (await getSession()) redirect(params.suite ?? "/app");
  const profile = params.profil;
  const t = await getTranslations("signup");
  const tAuth = await getTranslations("auth");
  const providers = enabledProviders().map((id) => ({ id, label: tAuth(`social.${id}`) }));
  const families = familiesForProfile(profile);
  const plans = (await getPublicPlans()).filter((plan) => families.includes(plan.family));
  const plan =
    plans.find((item) => item.code === params.forfait && item.priceCents !== null) ??
    plans.find((item) => item.priceCents === 0);
  const paid = Boolean(plan?.priceCents);

  return (
    <AuthCard width="lg" className="jm-rise">
      <SignupStepper current="account" paid={paid} />
      <AuthHeading
        title={t("account.title")}
        subtitle={profile === "talent" ? t("account.subtitle.talent") : t("account.subtitle.org")}
      />
      {plan && (
        <p className="flex items-center gap-3 rounded-[16px] bg-sapin py-2.5 pr-2.5 pl-4 text-[13px] text-blanc">
          <Icon name="portefeuille" className="size-[18px] shrink-0 text-lime" />
          <span className="flex-1">
            {t("account.planReminder", {
              plan: paid
                ? `${plan.name} · ${t("plan.price.monthly", { price: formatUsd(plan.priceCents ?? 0) })}`
                : plan.name,
            })}
          </span>
          <Link
            href={stepHref("/inscription/forfait", { ...params, forfait: plan.code })}
            className="flex h-8 items-center rounded-pill bg-blanc/10 px-3.5 text-xs font-semibold ring-1 ring-blanc/25 ring-inset hover:bg-blanc/20"
          >
            {t("account.planChange")}
          </Link>
        </p>
      )}
      {providers.length > 0 && profile === "talent" && (
        <>
          <form>
            <input type="hidden" name="profil" value={profile} />
            {plan && <input type="hidden" name="forfait" value={plan.code} />}
            {params.suite && <input type="hidden" name="next" value={params.suite} />}
            <SocialButtons
              providers={providers}
              label={tAuth("social.signupLabel")}
              aria={tAuth("social.aria.signup", { provider: "{provider}" })}
              action={signInWithProvider}
            />
          </form>
          <OrSeparator />
        </>
      )}
      <SignupAccountForm
        profile={profile}
        plan={plan?.code}
        next={params.suite}
        countries={countryOptions("code")}
        defaultEmail={(await readSignupFlow()).email}
      />
      <SignupFooter back={stepHref("/inscription/forfait", { ...params, forfait: plan?.code })} />
    </AuthCard>
  );
}
