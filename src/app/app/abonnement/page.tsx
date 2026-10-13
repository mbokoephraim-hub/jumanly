import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SubscriptionSection } from "@/components/billing/subscription-section";
import { Alert } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ownedOrganization } from "@/server/services/accounts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing.seo");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** « Mon abonnement »: the personal plan, and the organization's plan for its owner. */
export default async function BillingPage({ searchParams }: PageProps<"/app/abonnement">) {
  const params = await searchParams;
  const user = await requireUser("/app/abonnement");
  const t = await getTranslations();
  const org = await ownedOrganization(db, user.id);
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("billing.title")}</h1>
        <p className="text-ardoise">{t("billing.subtitle")}</p>
        <p className="text-sm font-medium text-feuille-fonce">{t("billing.applyFree")}</p>
      </header>
      {params.resiliation && <Alert tone="success" title={t("settings.saved")} />}
      {params.reactivation && <Alert tone="success" title={t("settings.saved")} />}
      {org && (
        <SubscriptionSection
          subject={{ type: "organization", id: org.id }}
          family="rh"
          families={["rh", "company"]}
          heading={t("orgBilling.title", { orgName: org.name })}
        />
      )}
      <SubscriptionSection
        subject={{ type: "user", id: user.id }}
        family="talent"
        families={["talent"]}
        heading={org ? t("spaceSwitcher.personal.text") : undefined}
      />
      <p className="text-sm text-ardoise">
        {t("billing.help.text", {
          email: org ? t("billing.help.emailPro") : t("billing.help.emailPersonal"),
        })}
      </p>
    </div>
  );
}
