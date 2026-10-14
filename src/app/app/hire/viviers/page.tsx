import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Button, EmptyState, PlanLock, Select, TextField } from "@/components/ui";
import { createPoolAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import { listPools, poolsEnabled, poolVisibilities } from "@/server/services/talent-search";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.pools");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Talent pools (E8, `hire.shortlist`; team and organization pools with `org.talent_pools.shared`). */
export default async function PoolsPage({ searchParams }: PageProps<"/app/hire/viviers">) {
  const query = await searchParams;
  const { ctx } = await requireHire("/app/hire/viviers", "readApplications");
  const t = await getTranslations();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [enabled, shared, plans] = await Promise.all([
    poolsEnabled(db, ctx.organizationId),
    can(db, subject, "org.talent_pools.shared"),
    listPublicPlans(db),
  ]);

  if (!enabled) {
    return (
      <div className="flex flex-col gap-6">
        <AppPageHeader title={t("hire.pools.title")} />
        <PlanLock
          plan={orgPlanFor(plans, "hire.shortlist")}
          description={t("hire.pools.subtitle")}
        />
      </div>
    );
  }

  const pools = await listPools(db, ctx);
  const manage = hirePermissions(ctx.role).manage;
  const erreur = typeof query.erreur === "string" ? query.erreur : "";

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader title={t("hire.pools.title")} subtitle={t("hire.pools.subtitle")} />
      {query.ok === "supprime" && <Alert tone="success" title={t("hire.pools.deleted")} />}
      {erreur === "invalid" && <Alert tone="error" title={t("hire.pools.invalid")} />}
      {erreur === "forbidden" && <Alert tone="error" title={t("hire.pools.error.forbidden")} />}

      {pools.length === 0 ? (
        <EmptyState title={t("hire.pools.empty")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pools.map((pool) => (
            <li key={pool.id} className="flex flex-col gap-1 rounded-card bg-blanc p-5">
              <Link href={`/app/hire/viviers/${pool.id}`} className="font-semibold underline">
                {pool.name}
              </Link>
              {pool.description && <p className="text-sm">{pool.description}</p>}
              <p className="text-sm text-ardoise">
                {[
                  t("hire.pools.count", { count: pool._count.entries }),
                  t(`hire.pools.visibility.${pool.visibility}`),
                  t("hire.pools.owner", { memberName: pool.owner?.name ?? "—" }),
                ].join(" · ")}
              </p>
              <p className="text-sm text-ardoise">
                {t("hire.pools.updatedOn", { date: pool.updatedAt })}
              </p>
            </li>
          ))}
        </ul>
      )}

      {manage && (
        <section
          aria-labelledby="new-pool"
          className="flex flex-col gap-4 rounded-card bg-blanc p-6"
        >
          <h2 id="new-pool" className="text-h2">
            {t("hire.pools.new")}
          </h2>
          <form action={createPoolAction} className="flex flex-col gap-4">
            <TextField
              id="pool-name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              label={t("hire.pools.name.text")}
              placeholder={t("hire.pools.name.placeholder")}
            />
            <TextField
              id="pool-description"
              name="description"
              maxLength={300}
              label={t("hire.pools.description")}
            />
            {shared ? (
              <Select
                id="pool-visibility"
                name="visibility"
                label={t("hire.pools.visibility.text")}
                defaultValue="private"
                options={poolVisibilities.map((value) => ({
                  value,
                  label: t(`hire.pools.visibility.${value}`),
                }))}
              />
            ) : (
              <p className="text-sm text-ardoise">
                {t("hire.pools.visibility.shared.locked", {
                  plan: orgPlanFor(plans, "org.talent_pools.shared"),
                })}
              </p>
            )}
            <p className="text-sm text-ardoise">{t("hire.pools.consentNote")}</p>
            <Button type="submit" className="self-start">
              {t("hire.pools.create")}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
