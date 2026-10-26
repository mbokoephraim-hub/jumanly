import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { OrgFormulaScreen, type OrgFormulaData } from "@/components/entreprise/billing";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { orgBillingScreen } from "@/server/services/org-billing";

const PAGE = "/app/organisation/facturation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orgFormula");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Formule et facturation (étape 3, A4, capture 083), for the owner and the administrators only: a
 * recruiter, a manager or a viewer gets « page introuvable ». Under 768 px the layout of
 * `/app/organisation` shows « À ouvrir sur un ordinateur ».
 */
export default async function OrgFormulaPage() {
  const { ctx } = await requireHire(PAGE, "administer");
  const [screen, messages, t] = await Promise.all([
    orgBillingScreen(db, ctx),
    getMessages(),
    getTranslations(),
  ]);
  // What a company plan adds after its users and its offers (the texts of the sign-up, A1).
  const extra = (code: string) => {
    const key = `adminSignup.plan.extra.${code}` as "adminSignup.plan.extra.company";
    return t.has(key) ? t(key) : "";
  };
  const iso = (date: Date | null) => date?.toISOString() ?? null;
  const data: OrgFormulaData = {
    plan: screen.plan,
    freePlanName: screen.freePlanName,
    until: iso(screen.until),
    paidUntil: iso(screen.paidUntil),
    graceUntil: iso(screen.graceUntil),
    canceled: screen.canceled,
    paidWith: screen.paidWith,
    pendingPlan: screen.pendingPlan,
    renewal: screen.renewal
      ? { totalCents: screen.renewal.totalCents, periodEnd: screen.renewal.periodEnd.toISOString() }
      : null,
    gauges: screen.gauges,
    seatsUsed: screen.gauges.seats.used,
    plans: screen.plans.map((plan) => ({ ...plan, extra: extra(plan.code) })),
    invoices: screen.invoices.map((invoice) => ({
      ...invoice,
      issuedAt: invoice.issuedAt.toISOString(),
    })),
  };
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["orgFormula", "adminSignup"])}>
      <OrgFormulaScreen data={data} />
    </NextIntlClientProvider>
  );
}
