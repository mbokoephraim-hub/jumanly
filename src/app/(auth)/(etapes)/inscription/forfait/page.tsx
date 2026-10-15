import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AuthCard,
  AuthHeading,
  AuthNote,
  SignupFooter,
  SignupStepper,
} from "@/components/auth/auth-card";
import { PlanChoice } from "@/components/auth/plan-choice";
import { PlanSubmit } from "@/components/auth/plan-submit";
import { Icon } from "@/components/brand/icon";
import { CompareTable } from "@/components/site/pricing";
import { ButtonLink, Skeleton } from "@/components/ui";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { readSignupParams, stepHref } from "@/lib/signup-params";
import { getPublicPlans } from "@/server/queries/public";
import { familiesForProfile } from "@/server/services/accounts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup");
  return pageMetadata({
    path: "/inscription/forfait",
    title: t("plan.seo.title"),
    description: t("plan.subtitle"),
    noindex: true,
  });
}

export default function SignupPlanPage({ searchParams }: PageProps<"/inscription/forfait">) {
  return (
    <Suspense fallback={<Skeleton className="h-[720px] w-full max-w-[760px] rounded-card" />}>
      <PlanStep searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Step 2 · plan of the family (mockup 02-05), Free pre-selected unless the visitor chose a plan
 * on /tarifs. Plans sold on quote are shown with the quote button, not as a choice.
 */
async function PlanStep({ searchParams }: Pick<PageProps<"/inscription/forfait">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (!params.profil || params.profil === "partner") redirect(stepHref("/inscription", params));
  const t = await getTranslations("signup");
  const families = familiesForProfile(params.profil);
  const allPlans = await getPublicPlans();
  const plans = allPlans.filter((plan) => families.includes(plan.family));
  const selectable = plans.filter(
    (plan) => plan.priceCents !== null && (plan.isPurchasable || plan.priceCents === 0),
  );
  const quotePlans = plans.filter((plan) => plan.priceCents === null);
  const free = selectable.find((plan) => plan.priceCents === 0);
  const selected = selectable.some((plan) => plan.code === params.forfait)
    ? params.forfait
    : free?.code;
  const labels = Object.fromEntries(
    selectable.map((plan) => [
      plan.code,
      plan.priceCents
        ? t("plan.cta.paid", { plan: plan.name, price: formatUsd(plan.priceCents) })
        : t("plan.cta.free", { plan: plan.name }),
    ]),
  );

  return (
    <AuthCard width="wide" className="jm-rise">
      <SignupStepper current="plan" paid={selected !== free?.code} />
      <AuthHeading title={t(`plan.title.${params.profil}`)} subtitle={t("plan.subtitle")} />
      <AuthNote icon="check" tone="lime">
        {t(`plan.freeReassurance.${params.profil}`)}
      </AuthNote>
      <form action="/inscription/compte" method="get" className="flex flex-col gap-5">
        <input type="hidden" name="profil" value={params.profil} />
        {params.suite && <input type="hidden" name="suite" value={params.suite} />}
        <PlanChoice plans={selectable} selected={selected} />
        {quotePlans.map((plan) => (
          <div
            key={plan.code}
            className="flex flex-col items-start gap-2 rounded-[24px] bg-blanc p-5 ring-[1.5px] ring-brume ring-inset"
          >
            <p className="text-xl font-bold">{plan.name}</p>
            <p className="text-sm text-ardoise">{t("plan.quote.text")}</p>
            <ButtonLink href="/contact?sujet=devis" variant="secondary" size="md">
              {t("plan.quote.cta")}
            </ButtonLink>
            <p className="text-xs text-ardoise">{t("plan.quote.hint")}</p>
          </div>
        ))}
        {params.profil === "talent" && (
          <div className="[&_details]:ring-[1.5px] [&_details]:ring-brume [&_details]:ring-inset">
            <CompareTable plans={allPlans} family="talent" />
          </div>
        )}
        <ul className="flex flex-col gap-2.5 rounded-[20px] bg-blanc px-5 py-4 text-[13px] leading-[19px]">
          <li className="flex items-start gap-3">
            <Icon name="mobile-money" className="mt-px size-4 shrink-0" />
            {t("plan.payment")}
          </li>
          <li className="flex items-start gap-3">
            <Icon name="check" className="mt-px size-4 shrink-0 text-feuille-fonce" />
            {t("plan.applyFree")}
          </li>
          {params.profil === "talent" && (
            <li className="flex items-start gap-3">
              <Icon name="certificat" className="mt-px size-4 shrink-0" />
              {t("plan.partnerCode")}
            </li>
          )}
        </ul>
        <div className="flex flex-col gap-3">
          <PlanSubmit labels={labels} selected={selected} fallback={t("continue")} />
          <p className="text-center text-xs text-ardoise">{t("plan.paidNote")}</p>
        </div>
      </form>
      <SignupFooter back={stepHref("/inscription", params)} />
    </AuthCard>
  );
}
