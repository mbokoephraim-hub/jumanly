import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SponsoredCard } from "@/components/billing/sponsored-card";
import { SubscriptionSection } from "@/components/billing/subscription-section";
import { Alert } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { ownedOrganization } from "@/server/services/accounts";
import { myLicenses } from "@/server/services/partners";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing.seo");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** « Mon abonnement »: the personal plan, and the organization's plan for its owner. */
export default async function BillingPage({ searchParams }: PageProps<"/app/abonnement">) {
  const params = await searchParams;
  const user = await requireUser("/app/abonnement");
  const t = await getTranslations();
  const now = new Date();
  const [org, licenses, plan] = await Promise.all([
    ownedOrganization(db, user.id),
    myLicenses(db, user.id, now),
    resolvePlan(db, { type: "user", id: user.id }, now),
  ]);
  const activated = licenses.find((license) => license.id === params.licence);
  return (
    <div className="flex flex-col gap-8">
      <AppPageHeader
        title={t("billing.title")}
        subtitle={
          <>
            <p>{t("billing.subtitle")}</p>
            <p className="font-semibold">{t("billing.applyFree")}</p>
          </>
        }
      />
      {activated &&
        (activated.pending ? (
          <Alert tone="info" title={t("activate.pending.title")}>
            {t("activate.pending.text", {
              plan: activated.planName,
              sponsorName: activated.sponsorName,
              currentPlan: plan?.planName ?? "",
            })}
          </Alert>
        ) : (
          <Alert tone="success" title={t("activate.success.title", { plan: activated.planName })}>
            {t("activate.success.text", {
              plan: activated.planName,
              sponsorName: activated.sponsorName,
              endDate: formatDate(activated.endDate),
            })}
          </Alert>
        ))}
      {params.consentement && <Alert tone="success" title={t("sponsored.consent.saved")} />}
      {params.resiliation && <Alert tone="success" title={t("settings.saved")} />}
      {params.reactivation && <Alert tone="success" title={t("settings.saved")} />}
      {params.facturation === "1" && (
        <Alert tone="success" title={t("billing.invoiceDetails.saved")} />
      )}
      {params.facturation === "erreur" && (
        <Alert tone="error" title={t("billing.invoiceDetails.error")} />
      )}
      {org && (
        <SubscriptionSection
          subject={{ type: "organization", id: org.id }}
          family="rh"
          families={["rh", "company"]}
          heading={t("orgBilling.title", { orgName: org.name })}
        />
      )}
      {licenses.map((license) => (
        <SponsoredCard
          key={license.id}
          license={license}
          currentPlan={plan?.planName ?? ""}
          now={now}
        />
      ))}
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
