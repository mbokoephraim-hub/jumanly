import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Alert, Button, EmptyState, TextField } from "@/components/ui";
import {
  deletePoolAction,
  removeFromPoolAction,
  renamePoolAction,
} from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { getPool, poolsEnabled } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.pools");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

export default async function PoolPage({
  params,
  searchParams,
}: PageProps<"/app/hire/viviers/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/viviers/${id}`, "readApplications");
  if (!(await poolsEnabled(db, ctx.organizationId))) notFound();
  const pool = await getPool(db, ctx, id).catch((error: Error) => {
    if (error.name === "HireError") notFound();
    throw error;
  });
  const t = await getTranslations();
  const permissions = hirePermissions(ctx.role);
  const manage = permissions.manage;
  const canDelete = manage && (pool.ownerId === ctx.userId || permissions.administer);
  const okText: Record<string, string> = {
    cree: t("hire.pools.created"),
    renomme: t("hire.pools.renamed"),
    retire: t("hire.pools.removed"),
  };
  const ok = typeof query.ok === "string" ? okText[query.ok] : undefined;
  const erreur = typeof query.erreur === "string" ? query.erreur : "";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/hire/viviers" className="text-sm underline">
        {t("hire.pools.back")}
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-h1">{pool.name}</h1>
        {pool.description && <p>{pool.description}</p>}
        <p className="text-sm text-ardoise">
          {[
            t("hire.pools.count", { count: pool.entries.length }),
            t(`hire.pools.visibility.${pool.visibility}`),
            t("hire.pools.owner", { memberName: pool.owner?.name ?? "—" }),
          ].join(" · ")}
        </p>
      </header>
      {ok && <Alert tone="success" title={ok} />}
      {erreur === "invalid" && <Alert tone="error" title={t("hire.pools.invalid")} />}
      {erreur === "forbidden" && <Alert tone="error" title={t("hire.pools.error.forbidden")} />}
      {erreur === "notFound" && <Alert tone="error" title={t("hire.pools.error.notFound")} />}

      {pool.entries.length === 0 ? (
        <EmptyState title={t("hire.pools.detail.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {pool.entries.map((entry) => (
            <li
              key={entry.profileId}
              className="flex flex-wrap items-start justify-between gap-4 rounded-card bg-blanc p-5"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-semibold">
                  {entry.anonymous
                    ? t("hire.talents.result.anonymous", { headline: entry.headline })
                    : [entry.name, entry.headline].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm text-ardoise">
                  {[
                    entry.anonymous ? null : entry.city,
                    t("hire.pools.addedOn", { date: entry.createdAt }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {entry.note && <p className="text-sm">{entry.note}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link
                  href={`/app/hire/talents/${entry.profileId}`}
                  className="font-medium underline"
                >
                  {t("hire.talents.result.view")}
                </Link>
                {manage && (
                  <form action={removeFromPoolAction}>
                    <input type="hidden" name="pool" value={pool.id} />
                    <input type="hidden" name="profile" value={entry.profileId} />
                    <Button type="submit" variant="tertiary" size="sm">
                      {t("hire.pools.remove")}
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-ardoise">{t("hire.pools.consentNote")}</p>

      {manage && (
        <section className="flex flex-col gap-4 rounded-card bg-blanc p-6">
          <form action={renamePoolAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="pool" value={pool.id} />
            <TextField
              id="pool-rename"
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={pool.name}
              label={t("hire.pools.rename")}
            />
            <Button type="submit" variant="secondary" size="sm">
              {t("hire.pools.save")}
            </Button>
          </form>
          {canDelete && (
            <details>
              <summary className="cursor-pointer font-medium underline">
                {t("hire.pools.delete.text")}
              </summary>
              <form
                action={deletePoolAction}
                className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
              >
                <input type="hidden" name="pool" value={pool.id} />
                <p className="font-semibold">
                  {t("hire.pools.delete.confirm.title", { poolName: pool.name })}
                </p>
                <p>{t("hire.pools.delete.confirm.body")}</p>
                <Button type="submit" variant="danger" size="sm">
                  {t("hire.pools.delete.text")}
                </Button>
              </form>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
