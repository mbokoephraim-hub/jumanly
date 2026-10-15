import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import {
  isPlanFamily,
  PlanFamilySegments,
  PlanTable,
  plansOfFamily,
} from "@/components/admin/forfaits-table";
import { AdminDone, AdminPageHeader } from "@/components/admin/kit";
import { NewPlanPanel, PlanError } from "@/components/admin/plan-panels";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";

/**
 * Plans by family (mockup 07-04), with their live subscribers. A row opens its edit form;
 * « Nouveau forfait » opens its panel (`?action=nouveau`, Admin v2 étape 5).
 */
export default async function AdminPlans({ searchParams }: PageProps<"/admin/forfaits">) {
  await connection();
  const admin = await requireAdmin();
  if (!admin) notFound();
  const query = await searchParams;
  const family = isPlanFamily(query.famille) ? query.famille : "talent";
  const writable = canWriteAdmin(admin);
  const [t, ta] = await Promise.all([getTranslations("admin.plans"), getTranslations("admin")]);
  const plans = await plansOfFamily(family);
  const listHref = `/admin/forfaits?famille=${family}`;
  return (
    <>
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      {query.ok === "supprime" && <AdminDone title={t("v2.done.deleted")} />}
      {typeof query.erreur === "string" && <PlanError t={ta} code={query.erreur} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlanFamilySegments current={family} />
        {writable && (
          <Link
            href={`${listHref}&action=nouveau#forfaits-panneau`}
            scroll={false}
            className="inline-flex h-10 items-center gap-2 rounded-pill bg-sapin px-[18px] text-[13px] font-semibold text-blanc hover:bg-sapin/90"
          >
            <Icon name="ajouter" aria-hidden className="size-4" />
            {t("new")}
          </Link>
        )}
      </div>
      <PlanTable plans={plans} />
      {writable && query.action === "nouveau" && (
        <div id="forfaits-panneau" className="scroll-mt-4">
          <NewPlanPanel family={family} closeHref={listHref} />
        </div>
      )}
    </>
  );
}
