import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import {
  isPlanFamily,
  PlanFamilySegments,
  PlanTable,
  plansOfFamily,
} from "@/components/admin/forfaits-table";
import { AdminPageHeader } from "@/components/admin/kit";
import { requireAdmin } from "@/server/auth/session";

/** Plans by family (mockup 07-04), with their live subscribers. A row opens its edit form. */
export default async function AdminPlans({ searchParams }: PageProps<"/admin/forfaits">) {
  await connection();
  if (!(await requireAdmin())) notFound();
  const query = await searchParams;
  const family = isPlanFamily(query.famille) ? query.famille : "talent";
  const t = await getTranslations("admin.plans");
  const plans = await plansOfFamily(family);
  return (
    <>
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      <PlanFamilySegments current={family} />
      <PlanTable plans={plans} />
    </>
  );
}
