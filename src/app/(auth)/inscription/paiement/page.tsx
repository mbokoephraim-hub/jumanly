import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading, SignupStepper } from "@/components/auth/auth-card";
import { CheckoutPanel } from "@/components/billing/checkout-panel";
import { ButtonLink, Skeleton } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.payment");
  return pageMetadata({
    path: "/inscription/paiement",
    title: t("seo.title"),
    description: t("subtitle", { plan: "" }),
    noindex: true,
  });
}

export default function PaymentPage({ searchParams }: PageProps<"/inscription/paiement">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] rounded-card" />}>
      <PaymentStep searchParams={searchParams} />
    </Suspense>
  );
}

/** Step 5 · paying for the chosen plan. « Commencer en Free » always works (partie 06 § 6.2). */
async function PaymentStep({
  searchParams,
}: Pick<PageProps<"/inscription/paiement">, "searchParams">) {
  const params = await searchParams;
  const user = await requireUser("/inscription/paiement");
  const flow = await readSignupFlow();
  const plan = flow.plan ? await db.plan.findUnique({ where: { code: flow.plan } }) : null;
  if (!plan?.priceCents) redirect("/app/bienvenue");
  const t = await getTranslations("signup.payment");
  const paymentId = typeof params.paiement === "string" ? params.paiement : undefined;
  return (
    <AuthCard>
      <SignupStepper current="payment" paid />
      <AuthHeading
        title={t("title", { plan: plan.name })}
        subtitle={t("subtitle", { plan: plan.name })}
      />
      <CheckoutPanel
        user={user}
        planCode={plan.code}
        context="signup"
        paymentId={paymentId}
        trial={params.essai === "1"}
        continueHref="/app/bienvenue"
        freeHref="/app/bienvenue"
      />
      {!paymentId && (
        <div className="flex flex-col items-start gap-2 rounded-card bg-creme p-5">
          <ButtonLink href="/app/bienvenue" variant="tertiary">
            {t("payLater.text")}
          </ButtonLink>
          <p className="text-sm text-ardoise">{t("payLater.help", { plan: plan.name })}</p>
        </div>
      )}
      <p className="text-sm text-ardoise">{t("prepaid")}</p>
    </AuthCard>
  );
}
