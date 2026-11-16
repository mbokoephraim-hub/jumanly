import { isModelB } from "@/server/phone-routes";
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhCompanyModeScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { COMPANY_TABS, HireV3Company, type CompanyTab } from "@/components/hire-v3/company";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import type { HireContext } from "@/server/services/hire";
import { companyOverview } from "@/server/services/hire-v3-company";
import { isOrgAdmin } from "@/server/services/hire-phone-account";

const PAGE = "/app/hire/entreprise";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("mode.line"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page({ searchParams }: PageProps<"/app/hire/entreprise">) {
  const { ctx } = await requireHire(PAGE);
  // Jumanly Hire (web app v3): « Page entreprise » for every member, edited by its administrators.
  if (isHireScope()) {
    const query = await searchParams;
    const tab: CompanyTab =
      (Object.keys(COMPANY_TABS) as CompanyTab[]).find(
        (key) => COMPANY_TABS[key] === query.onglet,
      ) ?? "overview";
    return (
      <Suspense fallback={null}>
        <CompanyV3 ctx={ctx} tab={tab} query={query} />
      </Suspense>
    );
  }
  // « Agir au nom de l'entreprise » belongs to the page's administrators (planche 186); on a
  // computer, they edit the page in the company's space.
  if (!isOrgAdmin(ctx.role)) redirect("/app/hire/compte");
  if (!(await isModelB())) redirect("/app/organisation");
  return (
    <RhCompteTexts>
      <RhCompanyModeScreen ctx={ctx} query={await searchParams} />
    </RhCompteTexts>
  );
}

/** The v3 page reads the people who say they work there one query after another: it streams. */
async function CompanyV3({
  ctx,
  tab,
  query,
}: {
  ctx: HireContext;
  tab: CompanyTab;
  query: Record<string, string | string[] | undefined>;
}) {
  return <HireV3Company tab={tab} data={await companyOverview(db, ctx)} query={query} />;
}
