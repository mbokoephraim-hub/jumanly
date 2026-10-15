import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { Initials, MenuChip, menuItem, moreButton } from "@/components/hire/kit";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { Alert, EmptyState, PlanLock, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import {
  createPoolAction,
  deletePoolAction,
  removeFromPoolAction,
  renamePoolAction,
} from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import {
  getPool,
  listPools,
  poolsEnabled,
  poolVisibilities,
} from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.pools");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

const visibilityIcon: Record<(typeof poolVisibilities)[number], IconName> = {
  private: "lock",
  team: "equipe",
  org: "entreprise",
};
const tiles: { icon: IconName; className: string }[] = [
  { icon: "statistiques", className: "bg-lime" },
  { icon: "objectif", className: "bg-menthe-claire" },
  { icon: "connect", className: "bg-lime-clair" },
  { icon: "confidentialite", className: "bg-gris-clair" },
];

/**
 * Talent pools (E8, `hire.shortlist`; team and organization pools with `org.talent_pools.shared`),
 * mockup 04-07: the pools as cards, the selected pool below with its talents, and the « Nouveau
 * vivier » panel beside. A talent who goes private leaves the pools unless they applied.
 */
export default async function PoolsPage({ searchParams }: PageProps<"/app/hire/viviers">) {
  const query = await searchParams;
  const { ctx, space } = await requireHire("/app/hire/viviers", "readApplications");
  const t = await getTranslations();
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [enabled, shared, plans] = await Promise.all([
    poolsEnabled(db, ctx.organizationId),
    can(db, subject, "org.talent_pools.shared"),
    listPublicPlans(db),
  ]);
  const eyebrow = t("hire.pipeline.eyebrow", { org: space.organization.name });

  if (!enabled) {
    return (
      <div className="jm-page flex flex-col gap-5">
        <AppPageHeader eyebrow={eyebrow} title={t("hire.pools.title")} />
        <PlanLock
          plan={orgPlanFor(plans, "hire.shortlist")}
          description={t("hire.pools.subtitle")}
        />
      </div>
    );
  }

  const permissions = hirePermissions(ctx.role);
  const manage = permissions.manage;
  const search = one(query.q).trim();
  const all = await listPools(db, ctx);
  const pools = search
    ? all.filter((pool) => pool.name.toLowerCase().includes(search.toLowerCase()))
    : all;
  const wanted = one(query.vivier);
  const selectedId = wanted || pools[0]?.id || "";
  const pool = selectedId
    ? await getPool(db, ctx, selectedId).catch((error: Error) => {
        if (error.name === "HireError") return null;
        throw error;
      })
    : null;
  const creating = manage && (query.nouveau === "1" || all.length === 0);
  const erreur = one(query.erreur);
  const okText: Record<string, string> = {
    cree: t("hire.pools.created"),
    renomme: t("hire.pools.renamed"),
    retire: t("hire.pools.removed"),
    supprime: t("hire.pools.deleted"),
  };
  const ok = okText[one(query.ok)];
  const ago = (date: Date) => format.relativeTime(date);
  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (wanted) next.set("vivier", wanted);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const text = next.toString();
    return text ? `/app/hire/viviers?${text}` : "/app/hire/viviers";
  };
  const canDelete = Boolean(
    pool && manage && (pool.ownerId === ctx.userId || permissions.administer),
  );
  const nameOf = (entry: { anonymous: boolean; name: string | null; headline: string }) =>
    entry.anonymous
      ? t("hire.talents.result.anonymous", { headline: entry.headline })
      : (entry.name ?? "");

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={eyebrow}
        title={t("hire.pools.title")}
        subtitle={t("hire.pools.subtitle")}
        actions={
          manage ? (
            <Link
              href={`${hrefWith({ nouveau: "1" })}#nouveau-vivier`}
              className={pillClass("lime", "md")}
            >
              <Icon name="ajouter" className="size-4" />
              {t("hire.pools.new")}
            </Link>
          ) : undefined
        }
      />
      {ok && <ToastOnLoad message={ok} tone="success" />}
      {erreur === "invalid" && <Alert tone="error" title={t("hire.pools.invalid")} />}
      {erreur === "forbidden" && <Alert tone="error" title={t("hire.pools.error.forbidden")} />}
      {(erreur === "notFound" || (wanted && !pool)) && (
        <Alert tone="error" title={t("hire.pools.error.notFound")} />
      )}

      {all.length > 0 && (
        <form method="get" className="flex justify-end" role="search">
          <label className="flex h-11 w-full items-center gap-2.5 rounded-pill bg-blanc px-4 ring-[1.5px] ring-brume ring-inset focus-within:ring-sapin sm:w-72">
            <Icon name="recherche" className="size-4 shrink-0" />
            <span className="sr-only">{t("hire.pools.search")}</span>
            <input
              id="pools-q"
              name="q"
              maxLength={80}
              defaultValue={search}
              placeholder={t("hire.pools.search")}
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ardoise"
            />
          </label>
        </form>
      )}

      {all.length === 0 ? (
        <EmptyState title={t("hire.pools.empty")} />
      ) : pools.length === 0 ? (
        <p className="rounded-[24px] bg-blanc p-6 text-[14px] text-ardoise">
          {t("hire.pools.searchEmpty", { query: search })}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
          {pools.map((item, index) => {
            const tile = tiles[index % tiles.length]!;
            const current = item.id === pool?.id;
            const more = item._count.entries - item.entries.length;
            return (
              <li
                key={item.id}
                data-reveal=""
                className={cx(
                  "flex flex-col gap-3 rounded-[24px] bg-blanc p-[18px]",
                  current && "ring-2 ring-sapin",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    aria-hidden
                    className={cx(
                      "grid size-[46px] place-items-center rounded-[14px]",
                      tile.className,
                    )}
                  >
                    <Icon name={tile.icon} className="size-5" />
                  </span>
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-gris-clair px-3 text-[11.5px] font-semibold">
                    <Icon name={visibilityIcon[item.visibility]} className="size-3.5" />
                    {t(`hire.pools.visibility.${item.visibility}`)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[15px] leading-5 font-semibold">{item.name}</h2>
                  <p className="min-h-4 text-[12px] leading-4 text-ardoise">{item.description}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex -space-x-2">
                    {item.entries.map((entry) =>
                      entry.profile.visibility === "anonymous" ? (
                        <span
                          key={entry.profileId}
                          aria-hidden
                          className="grid size-7 place-items-center rounded-full bg-gris-clair ring-2 ring-blanc"
                        >
                          <Icon name="profil" className="size-3.5 text-ardoise" />
                        </span>
                      ) : (
                        <Initials
                          key={entry.profileId}
                          name={entry.profile.user.name}
                          size={28}
                          className="ring-2 ring-blanc"
                        />
                      ),
                    )}
                    {more > 0 && (
                      <span className="grid size-7 place-items-center rounded-full bg-sapin text-[10px] font-semibold text-neon ring-2 ring-blanc">
                        {["+", String(more)].join("")}
                      </span>
                    )}
                  </span>
                  <span className="text-[13px] font-semibold">
                    {t("hire.pools.count", { count: item._count.entries })}
                  </span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-2 border-t border-gris-clair pt-3">
                  <p className="flex min-w-0 flex-col text-[11.5px] leading-4 text-ardoise">
                    <span>{t("hire.pools.updatedAgo", { time: ago(item.updatedAt) })}</span>
                    <span className="truncate">
                      {t("hire.pools.owner", { memberName: item.owner?.name ?? "—" })}
                    </span>
                  </p>
                  <Link
                    href={`/app/hire/viviers?${new URLSearchParams({ ...(search ? { q: search } : {}), vivier: item.id })}#vivier`}
                    aria-current={current ? "true" : undefined}
                    aria-label={[t("hire.pools.open"), item.name].join(" · ")}
                    className={pillClass(current ? "dark" : "outline", "sm", "shrink-0")}
                  >
                    {t("hire.pools.open")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-center gap-3 rounded-[20px] bg-blanc px-4 py-3.5 text-[13px] leading-[18px] max-lg:order-last">
        <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-lime-clair">
          <Icon name="lock" className="size-4" />
        </span>
        {t("hire.pools.consentNote")}
      </p>

      <div
        className={cx(
          "grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:gap-5",
          creating && "lg:grid-cols-[minmax(0,1fr)_380px]",
        )}
      >
        {pool ? (
          <section
            id="vivier"
            aria-labelledby="vivier-title"
            className="flex min-w-0 scroll-mt-24 flex-col gap-3"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2
                  id="vivier-title"
                  className="text-[22px] leading-7 font-semibold tracking-[-0.015em]"
                >
                  {pool.name}
                </h2>
                <p className="text-[12.5px] text-ardoise">
                  {[
                    t("hire.pools.count", { count: pool.entries.length }),
                    t(`hire.pools.visibility.${pool.visibility}`),
                    t("hire.pools.owner", { memberName: pool.owner?.name ?? "—" }),
                  ].join(" · ")}
                </p>
              </div>
              {manage && (
                <div className="flex flex-wrap gap-2">
                  <MenuChip
                    group="pool-actions"
                    align="left"
                    summaryClassName={pillClass("outline", "sm")}
                    summary={
                      <>
                        <Icon name="edit" className="size-4" />
                        {t("hire.pools.rename")}
                      </>
                    }
                  >
                    <form action={renamePoolAction} className="flex w-72 flex-col gap-3 p-2">
                      <input type="hidden" name="pool" value={pool.id} />
                      <TextField
                        id="pool-rename"
                        name="name"
                        required
                        minLength={2}
                        maxLength={80}
                        defaultValue={pool.name}
                        label={t("hire.pools.name.text")}
                      />
                      <button type="submit" className={pillClass("dark", "sm", "self-start")}>
                        {t("hire.pools.save")}
                      </button>
                    </form>
                  </MenuChip>
                  {canDelete && (
                    <MenuChip
                      group="pool-actions"
                      align="right"
                      summaryClassName={pillClass("outline", "sm")}
                      summary={t("hire.pools.delete.text")}
                    >
                      <form action={deletePoolAction} className="flex w-72 flex-col gap-2 p-2">
                        <input type="hidden" name="pool" value={pool.id} />
                        <p className="text-[14px] font-semibold">
                          {t("hire.pools.delete.confirm.title", { poolName: pool.name })}
                        </p>
                        <p className="text-[12.5px] leading-[18px] text-ardoise">
                          {t("hire.pools.delete.confirm.body")}
                        </p>
                        <button
                          type="submit"
                          className="mt-1 inline-flex h-9 items-center self-start rounded-pill bg-down-texte px-4 text-[13px] font-semibold text-blanc"
                        >
                          {t("hire.pools.delete.text")}
                        </button>
                      </form>
                    </MenuChip>
                  )}
                </div>
              )}
            </div>
            {pool.description && <p className="text-[13px] text-ardoise">{pool.description}</p>}
            {pool.entries.length === 0 ? (
              <EmptyState title={t("hire.pools.detail.empty")} />
            ) : (
              <div className="overflow-hidden rounded-[24px] lg:bg-blanc">
                <div
                  aria-hidden
                  className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-4 border-b border-gris-clair px-5 py-3 text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase max-lg:hidden"
                >
                  <span>{t("hire.pools.table.talent")}</span>
                  <span>{t("hire.pools.table.origin")}</span>
                  <span>{t("hire.pools.table.added")}</span>
                  <span className="w-60" />
                </div>
                <ul className="flex flex-col max-lg:gap-3 lg:divide-y lg:divide-gris-clair">
                  {pool.entries.map((entry) => {
                    const name = nameOf(entry);
                    const profileHref = `/app/hire/talents/${entry.profileId}`;
                    return (
                      <li
                        key={entry.profileId}
                        className="flex items-center gap-3 bg-blanc px-4 py-3.5 max-lg:rounded-[22px] lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] lg:gap-4 lg:px-5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {entry.anonymous ? (
                            <span
                              aria-hidden
                              className="grid size-10 shrink-0 place-items-center rounded-full bg-gris-clair"
                            >
                              <Icon name="profil" className="size-4 text-ardoise" />
                            </span>
                          ) : (
                            <Initials name={name} size={40} />
                          )}
                          <div className="flex min-w-0 flex-col">
                            <Link
                              href={profileHref}
                              className="line-clamp-2 text-[14px] leading-[18px] font-semibold hover:underline"
                            >
                              {name}
                            </Link>
                            <p className="text-[12px] leading-4 text-ardoise">
                              {[
                                entry.anonymous ? null : entry.headline,
                                entry.anonymous ? null : entry.city,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            {entry.note && (
                              <p className="mt-0.5 text-[12px] leading-4 italic">{entry.note}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-[12.5px] leading-[18px] max-lg:hidden">
                          {entry.origin.kind === "applied"
                            ? t("hire.pools.origin.applied", { jobTitle: entry.origin.jobTitle })
                            : t(`hire.pools.origin.${entry.origin.kind}`)}
                        </p>
                        <p className="text-[12.5px] text-ardoise max-lg:hidden">
                          {t("hire.pools.addedAgo", { time: ago(entry.createdAt) })}
                        </p>
                        <div className="flex shrink-0 items-center justify-end gap-2 lg:w-60">
                          <Link
                            href={`${profileHref}#contact`}
                            className={pillClass(
                              "outline",
                              "sm",
                              "whitespace-nowrap max-lg:hidden",
                            )}
                          >
                            {t("hire.pools.addToJob")}
                          </Link>
                          <MenuChip
                            group="pool-entry"
                            align="right"
                            summaryClassName={moreButton}
                            summary={
                              <>
                                <Icon name="more" className="size-4" />
                                <span className="sr-only">{t("hire.pools.actions", { name })}</span>
                              </>
                            }
                          >
                            <Link href={profileHref} className={menuItem}>
                              <Icon name="eye" />
                              {t("hire.talents.result.view")}
                            </Link>
                            <Link
                              href={`${profileHref}#contact`}
                              className={cx(menuItem, "lg:hidden")}
                            >
                              <Icon name="jobs" />
                              {t("hire.pools.addToJob")}
                            </Link>
                            {manage && (
                              <form action={removeFromPoolAction}>
                                <input type="hidden" name="pool" value={pool.id} />
                                <input type="hidden" name="profile" value={entry.profileId} />
                                <button
                                  type="submit"
                                  className={cx(menuItem, "w-full text-down-texte")}
                                >
                                  <Icon name="fermer" />
                                  {t("hire.pools.remove")}
                                </button>
                              </form>
                            )}
                          </MenuChip>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <span />
        )}

        {creating && (
          <section
            id="nouveau-vivier"
            aria-labelledby="new-pool"
            className="flex scroll-mt-24 flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:sticky lg:top-6 lg:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="new-pool" className="text-[20px] font-semibold">
                {t("hire.pools.new")}
              </h2>
              {all.length > 0 && (
                <Link
                  href={hrefWith({ nouveau: null })}
                  aria-label={t("common.close")}
                  className="grid size-8 place-items-center rounded-full hover:bg-creme"
                >
                  <Icon name="fermer" className="size-4" />
                </Link>
              )}
            </div>
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
                label={t("hire.pools.descriptionShort")}
              />
              {shared ? (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[14px] font-semibold">
                    {t("hire.pools.visibility.text")}
                  </legend>
                  {poolVisibilities.map((value) => (
                    <label
                      key={value}
                      className="flex h-12 cursor-pointer items-center gap-3 rounded-[16px] px-4 ring-[1.5px] ring-brume ring-inset has-checked:bg-lime-clair has-checked:ring-lime has-[:focus-visible]:ring-sapin"
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={value}
                        defaultChecked={value === "private"}
                        className="size-5 accent-sapin"
                      />
                      <Icon name={visibilityIcon[value]} className="size-4" />
                      <span className="text-[14px] font-medium">
                        {t(`hire.pools.visibility.${value}`)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <p className="flex items-center gap-2 text-[12.5px] text-ardoise">
                  <Icon name="lock" className="size-3.5" />
                  {t("hire.pools.visibility.shared.locked", {
                    plan: orgPlanFor(plans, "org.talent_pools.shared"),
                  })}
                </p>
              )}
              <button type="submit" className={pillClass("lime", "md", "w-full")}>
                {t("hire.pools.create")}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
