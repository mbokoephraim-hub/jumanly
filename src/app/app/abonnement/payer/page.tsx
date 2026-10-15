import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckoutPanel } from "@/components/billing/checkout-panel";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { billingSubject } from "@/server/services/accounts";
import { quoteCheckout } from "@/server/services/subscriptions";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Paying for a plan from « Mon abonnement » (upgrade, renewal, plan chosen at sign-up), mockups
 * 05-03 to 05-05. The result is shown on the same address (`&paiement=`), so that the provider's
 * return URL and the polling of a pending payment stay as they are.
 */
export default async function PayPage({ searchParams }: PageProps<"/app/abonnement/payer">) {
  const params = await searchParams;
  const user = await requireUser("/app/abonnement");
  const code = typeof params.forfait === "string" ? params.forfait : "";
  const plan = code ? await db.plan.findUnique({ where: { code } }) : null;
  if (!plan) redirect("/app/abonnement");
  const t = await getTranslations();
  const paymentId = typeof params.paiement === "string" ? params.paiement : undefined;
  const subject = await billingSubject(db, user.id, plan.family);
  const quote = subject && !paymentId ? await quoteCheckout(db, subject, plan.code) : null;
  const eyebrow = paymentId
    ? t("checkout.result.eyebrow")
    : quote?.kind === "renewal"
      ? t("renewal.page.title", { plan: plan.name })
      : t("billing.upgrade.title", { plan: plan.name });
  return (
    <div className="jm-page flex flex-col gap-5 lg:gap-6">
      <AppPageHeader eyebrow={eyebrow} title={t("checkout.title")} />
      <CheckoutPanel
        user={user}
        planCode={plan.code}
        context="billing"
        paymentId={paymentId}
        trial={params.essai === "1"}
        continueHref="/app/abonnement"
        freeHref="/app/abonnement"
      />
    </div>
  );
}
