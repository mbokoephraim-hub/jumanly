import { notFound } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui";
import { formatUsd } from "@/lib/money";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";

const families = [
  { family: "talent", key: "talents" },
  { family: "rh", key: "rh" },
  { family: "company", key: "companies" },
  { family: "partner", key: "partners" },
] as const;

/** Plans by family, with their live subscribers. */
export default async function AdminPlans() {
  await connection();
  if (!(await requireAdmin())) notFound();
  const t = await getTranslations("admin.plans");
  const now = new Date();
  const plans = await db.plan.findMany({
    orderBy: [{ family: "asc" }, { sortOrder: "asc" }],
    include: {
      _count: {
        select: {
          subscriptions: {
            where: {
              status: { in: ["active", "trialing", "past_due", "sponsored"] },
              currentPeriodEnd: { gt: now },
            },
          },
        },
      },
    },
  });
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-ardoise">{t("subtitle")}</p>
      </header>
      {families.map(({ family, key }) => (
        <section key={family} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
          <h2 className="text-h2">{t(`family.${key}`)}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-ardoise">
                  <th className="py-2 pr-4 font-medium">{t("col.name")}</th>
                  <th className="py-2 pr-4 font-medium">{t("col.code")}</th>
                  <th className="py-2 pr-4 font-medium">{t("col.price")}</th>
                  <th className="py-2 pr-4 font-medium">{t("col.subscribers")}</th>
                  <th className="py-2 font-medium">{t("col.status")}</th>
                </tr>
              </thead>
              <tbody>
                {plans
                  .filter((plan) => plan.family === family)
                  .map((plan) => (
                    <tr key={plan.id} className="border-t border-brume">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/admin/forfaits/${plan.code}`}
                          className="font-semibold underline"
                        >
                          {plan.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 font-mono">{plan.code}</td>
                      <td className="py-2 pr-4">
                        {plan.priceCents === null ? t("status.quote") : formatUsd(plan.priceCents)}
                      </td>
                      <td className="py-2 pr-4">{plan._count.subscriptions}</td>
                      <td className="py-2">
                        <Badge tone={plan.isPublic ? "success" : "neutral"}>
                          {plan.isPublic ? t("status.public") : t("status.hidden")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
