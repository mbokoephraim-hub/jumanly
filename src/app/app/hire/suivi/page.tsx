import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireV3Suivi, SUIVI_TABS, type SuiviTab } from "@/components/hire-v3/suivi";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { automationHistory, automationOverview } from "@/server/services/hire-v3-automation";

const PAGE = "/app/hire/suivi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Suivi");
  return { title: t("title"), robots: { index: false } };
}

/** « Suivi automatique » of the recruiter's web app v3 (`V.suivi` of the prototype, 32-33). */
export default async function Page({ searchParams }: PageProps<"/app/hire/suivi">) {
  if (!isHireScope()) notFound();
  const { ctx } = await requireHire(PAGE);
  const query = await searchParams;
  const tab: SuiviTab =
    (Object.keys(SUIVI_TABS) as SuiviTab[]).find((key) => SUIVI_TABS[key] === query.onglet) ??
    "rules";
  const [overview, history] = await Promise.all([
    automationOverview(db, ctx),
    automationHistory(db, ctx),
  ]);
  return <HireV3Suivi tab={tab} overview={overview} history={history} query={query} />;
}
