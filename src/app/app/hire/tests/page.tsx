import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireEmpty } from "@/components/hire-v3/empty";
import { HirePage, HirePageHead } from "@/components/hire-v3/page-head";
import { isHireScope } from "@/lib/product-scope";
import { requireHire } from "@/server/hire-context";

const PAGE = "/app/hire/tests";
const TABS = { mine: "mes-tests", results: "resultats", library: "bibliotheque" } as const;
type Tab = keyof typeof TABS;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Tests");
  return { title: t("title"), robots: { index: false } };
}

/** « Tests » of the recruiter's web app v3 (`V.tests` of the prototype, screens 29-31). */
export default async function Page({ searchParams }: PageProps<"/app/hire/tests">) {
  if (!isHireScope()) notFound();
  await requireHire(PAGE);
  const t = await getTranslations("hireV3Tests");
  const query = await searchParams;
  const tab: Tab = (Object.keys(TABS) as Tab[]).find((key) => TABS[key] === query.onglet) ?? "mine";
  return (
    <HirePage view="tests">
      <HirePageHead
        title={t(`heads.${tab}`)}
        sub={t("soon")}
        tabs={(Object.keys(TABS) as Tab[]).map((key) => ({
          label: t(`tabs.${key}`),
          href: key === "mine" ? PAGE : `${PAGE}?onglet=${TABS[key]}`,
          active: key === tab,
        }))}
      />
      <div className="tsbox" style={{ display: "flex", minHeight: 320 }}>
        <HireEmpty icon="tests" title={t("emptyTitle")} text={t("emptyText")} />
      </div>
    </HirePage>
  );
}
