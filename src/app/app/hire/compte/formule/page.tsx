import { isModelB } from "@/server/phone-routes";
import { HireV3Plan } from "@/components/hire-v3/plan";
import { HirePage, HirePageHead } from "@/components/hire-v3/page-head";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { hirePermissions } from "@/server/services/hire";
import { orgBillingScreen } from "@/server/services/org-billing";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhPlanScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { requireHire } from "@/server/hire-context";

const PAGE = "/app/hire/compte/formule";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("plan.title"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page({ searchParams }: PageProps<"/app/hire/compte/formule">) {
  const { ctx } = await requireHire(PAGE);
  if (isHireScope()) {
    const query = await searchParams;
    if (!hirePermissions(ctx.role).administer) {
      const t = await getTranslations("hireV3Plan");
      return (
        <HirePage view="formule">
          <HirePageHead title={t("title")} sub={t("adminOnly")} />
        </HirePage>
      );
    }
    const [data, members] = await Promise.all([
      orgBillingScreen(db, ctx),
      db.membership.findMany({
        where: { organizationId: ctx.organizationId, status: "active" },
        orderBy: { createdAt: "asc" },
        select: { user: { select: { name: true } } },
      }),
    ]);
    return (
      <HireV3Plan
        data={data}
        tab={query.onglet === "factures" ? "factures" : "formule"}
        members={members.map((m) => m.user.name)}
      />
    );
  }
  if (!(await isModelB())) redirect("/app/abonnement");
  return (
    <RhCompteTexts>
      <RhPlanScreen ctx={ctx} query={await searchParams} />
    </RhCompteTexts>
  );
}
