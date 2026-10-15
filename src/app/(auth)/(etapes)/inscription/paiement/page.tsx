import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  AuthCard,
  AuthHeading,
  AuthNote,
  SignupFooter,
  SignupStepper,
} from "@/components/auth/auth-card";
import { CheckoutPanel } from "@/components/billing/checkout-panel";
import { Icon } from "@/components/brand/icon";
import { Skeleton } from "@/components/ui";
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
  if (!plan?.priceCents) redirect("/app/bienvenue?arrivee=1");
  const t = await getTranslations("signup.payment");
  const paymentId = typeof params.paiement === "string" ? params.paiement : undefined;
  return (
    <AuthCard width="xl" className="jm-rise">
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
        continueHref="/app/bienvenue?arrivee=1"
        freeHref="/app/bienvenue?arrivee=1"
      />
      {!paymentId && (
        <Link
          href="/app/bienvenue?arrivee=1"
          className="group flex flex-col gap-1 rounded-[20px] bg-blanc px-5 py-4 ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40"
        >
          <span className="flex items-center gap-1.5 text-[15px] font-semibold">
            {t("payLater.text")}
            <Icon
              name="chev-r"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span className="text-xs leading-[17px] text-ardoise">
            {t("payLater.help", { plan: plan.name })}
          </span>
        </Link>
      )}
      <AuthNote icon="check" tone="lime">
        {t("applyFree")}
      </AuthNote>
      <SignupFooter />
    </AuthCard>
  );
}
