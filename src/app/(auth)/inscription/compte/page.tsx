import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading, SignupStepper } from "@/components/auth/auth-card";
import { SignupAccountForm } from "@/components/auth/forms";
import { Button, Skeleton } from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { readSignupParams, stepHref } from "@/lib/signup-params";
import { signInWithGoogle } from "@/server/actions/auth";
import { googleEnabled } from "@/server/auth";
import { getSession } from "@/server/auth/session";
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

/** Step 3 · account. Google sign-up is offered to talents (an organization needs its name). */
async function AccountStep({
  searchParams,
}: Pick<PageProps<"/inscription/compte">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (!params.profil || params.profil === "partner") redirect(stepHref("/inscription", params));
  if (await getSession()) redirect(params.suite ?? "/app");
  const profile = params.profil;
  const t = await getTranslations("signup");
  const families = familiesForProfile(profile);
  const plans = (await getPublicPlans()).filter((plan) => families.includes(plan.family));
  const plan =
    plans.find((item) => item.code === params.forfait && item.priceCents !== null) ??
    plans.find((item) => item.priceCents === 0);
  const paid = Boolean(plan?.priceCents);

  return (
    <AuthCard>
      <SignupStepper current="account" paid={paid} />
      <AuthHeading
        title={t("account.title")}
        subtitle={profile === "talent" ? t("account.subtitle.talent") : t("account.subtitle.org")}
      />
      {plan && (
        <p className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-creme px-4 py-3 text-sm">
          <span>
            {t("account.planReminder", {
              plan: paid
                ? `${plan.name} · ${t("plan.price.monthly", { price: formatUsd(plan.priceCents ?? 0) })}`
                : plan.name,
            })}
          </span>
          <Link
            href={stepHref("/inscription/forfait", { ...params, forfait: plan.code })}
            className="font-semibold underline"
          >
            {t("account.planChange")}
          </Link>
        </p>
      )}
      {googleEnabled && profile === "talent" && (
        <form action={signInWithGoogle}>
          <input
            type="hidden"
            name="next"
            value={stepHref("/app/bienvenue", { suite: params.suite })}
          />
          <Button type="submit" variant="secondary" size="lg" fullWidth>
            {t("account.google")}
          </Button>
        </form>
      )}
      <SignupAccountForm
        profile={profile}
        plan={plan?.code}
        next={params.suite}
        countries={countryOptions("code")}
      />
      <p className="text-sm">
        {t("hasAccount")}{" "}
        <Link href="/connexion" className="font-semibold underline">
          {t("loginLink")}
        </Link>
      </p>
    </AuthCard>
  );
}
