import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckoutPanel } from "@/components/billing/checkout-panel";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Paying for a plan from « Mon abonnement » (upgrade, renewal, plan chosen at sign-up). */
export default async function PayPage({ searchParams }: PageProps<"/app/abonnement/payer">) {
  const params = await searchParams;
  const user = await requireUser("/app/abonnement");
  const code = typeof params.forfait === "string" ? params.forfait : "";
  const plan = code ? await db.plan.findUnique({ where: { code } }) : null;
  if (!plan) redirect("/app/abonnement");
  const t = await getTranslations();
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <AppPageHeader
        title={t("billing.upgrade.title", { plan: plan.name })}
        subtitle={t("billing.upgrade.text")}
      />
      <div className="rounded-card bg-blanc p-6">
        <CheckoutPanel
          user={user}
          planCode={plan.code}
          context="billing"
          paymentId={typeof params.paiement === "string" ? params.paiement : undefined}
          trial={params.essai === "1"}
          continueHref="/app/abonnement"
          freeHref="/app/abonnement"
        />
      </div>
      <Link href="/app/abonnement" className="text-sm underline">
        {t("checkout.cancel")}
      </Link>
    </div>
  );
}
