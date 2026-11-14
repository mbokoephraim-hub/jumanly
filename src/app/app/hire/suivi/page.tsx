import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireEmpty } from "@/components/hire-v3/empty";
import { HirePage, HirePageHead } from "@/components/hire-v3/page-head";
import { isHireScope } from "@/lib/product-scope";
import { requireHire } from "@/server/hire-context";

const PAGE = "/app/hire/suivi";
const TABS = { rules: "regles", history: "historique" } as const;
type Tab = keyof typeof TABS;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Suivi");
  return { title: t("title"), robots: { index: false } };
}

/** « Suivi automatique » of the recruiter's web app v3 (`V.suivi` of the prototype, 32-33). */
export default async function Page({ searchParams }: PageProps<"/app/hire/suivi">) {
  if (!isHireScope()) notFound();
  await requireHire(PAGE);
  const t = await getTranslations("hireV3Suivi");
  const query = await searchParams;
  const tab: Tab =
    (Object.keys(TABS) as Tab[]).find((key) => TABS[key] === query.onglet) ?? "rules";
  return (
    <HirePage view="suivi">
      <HirePageHead
        title={t(`heads.${tab}`)}
        sub={t("sub")}
        tabs={(Object.keys(TABS) as Tab[]).map((key) => ({
          label: t(`tabs.${key}`),
          href: key === "rules" ? PAGE : `${PAGE}?onglet=${TABS[key]}`,
          active: key === tab,
        }))}
      />
      <div className="tsbox" style={{ display: "flex", minHeight: 320 }}>
        <HireEmpty icon="refresh" title={t("emptyTitle")} text={t("emptyText")} />
      </div>
    </HirePage>
  );
}
