import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading, SignupStepper } from "@/components/auth/auth-card";
import { PlanChoice } from "@/components/auth/plan-choice";
import { Button, ButtonLink, Skeleton } from "@/components/ui";
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
    <Suspense fallback={<Skeleton className="h-[720px] rounded-card" />}>
      <PlanStep searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Step 2 · plan of the family, Free pre-selected unless the visitor chose a plan on /tarifs.
 * Plans sold on quote are shown with the quote button, not as a choice.
 */
async function PlanStep({ searchParams }: Pick<PageProps<"/inscription/forfait">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (!params.profil || params.profil === "partner") redirect(stepHref("/inscription", params));
  const t = await getTranslations("signup");
  const families = familiesForProfile(params.profil);
  const plans = (await getPublicPlans()).filter((plan) => families.includes(plan.family));
  const selectable = plans.filter(
    (plan) => plan.priceCents !== null && (plan.isPurchasable || plan.priceCents === 0),
  );
  const quotePlans = plans.filter((plan) => plan.priceCents === null);
  const free = selectable.find((plan) => plan.priceCents === 0);
  const selected = selectable.some((plan) => plan.code === params.forfait)
    ? params.forfait
    : free?.code;

  return (
    <AuthCard className="bg-transparent p-0 md:p-0">
      <div className="flex flex-col gap-4 rounded-card bg-blanc p-6 md:p-8">
        <SignupStepper current="plan" paid={selected !== free?.code} />
        <AuthHeading title={t(`plan.title.${params.profil}`)} subtitle={t("plan.subtitle")} />
        <p className="rounded-md bg-lime/40 p-4 text-[15px]">
          {t(`plan.freeReassurance.${params.profil}`)}
        </p>
      </div>
      <form action="/inscription/compte" method="get" className="flex flex-col gap-4">
        <input type="hidden" name="profil" value={params.profil} />
        {params.suite && <input type="hidden" name="suite" value={params.suite} />}
        <PlanChoice plans={selectable} selected={selected} />
        {quotePlans.map((plan) => (
          <div
            key={plan.code}
            className="flex flex-col items-start gap-2 rounded-card bg-blanc p-5"
          >
            <p className="font-semibold">{plan.name}</p>
            <p className="text-sm text-ardoise">{t("plan.quote.text")}</p>
            <ButtonLink href="/contact?sujet=devis" variant="secondary" size="sm">
              {t("plan.quote.cta")}
            </ButtonLink>
            <p className="text-ardoise text-caption">{t("plan.quote.hint")}</p>
          </div>
        ))}
        <div className="flex flex-col gap-2 rounded-card bg-blanc p-5 text-sm text-ardoise">
          <p>{t("plan.payment")}</p>
          <p>{t("plan.applyFree")}</p>
          {params.profil === "talent" && <p>{t("plan.partnerCode")}</p>}
          <p>{t("plan.paidNote")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={stepHref("/inscription", params)} className="text-sm underline">
            {t("back")}
          </Link>
          <Button type="submit" size="lg">
            {t("continue")}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
