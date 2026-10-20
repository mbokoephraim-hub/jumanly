import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { avatarTone, initialsOf } from "@/components/recruiter/candidates";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import {
  deletePoolAction,
  removeFromPoolAction,
  renamePoolAction,
} from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError, hirePermissions } from "@/server/services/hire";
import { getPool } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hirePools");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * One pool (brief recruteur § 4 item 4): its talents, where each one came from, the note left
 * when adding them; open a profile, remove a talent, rename or delete the pool.
 */
export default async function PoolPage({
  params,
  searchParams,
}: PageProps<"/app/hire/viviers/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const page = `/app/hire/viviers/${id}`;
  const { ctx } = await requireHire(page, "readApplications");
  const t = await getTranslations("hirePools");
  const pool = await getPool(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const canDelete = pool.ownerId === ctx.userId || permissions.administer;
  const offer = one(query.offre);
  const ok = one(query.ok);
  const toasts: Record<string, string> = {
    cree: t("ok.created"),
    retire: t("ok.removed"),
    renomme: t("ok.renamed"),
    vivier: t("ok.added"),
  };
  const erreur = one(query.erreur);

  return (
    <div className="t-flux t-ri-vivier">
      {toasts[ok] && <ToastOnLoad message={toasts[ok]} tone="success" />}
      <FlowHead
        back="/app/hire/viviers"
        backLabel={t("backPools")}
        title={pool.name}
        end={
          permissions.manage ? (
            <SheetButton target="ri-v-menu" label={t("menu")} className="t-bi t-press">
              <TalentIcon name="plus-options" size="s" />
            </SheetButton>
          ) : undefined
        }
      />
      <p className="t-rc-note">
        {[
          t(`visibilityOption.${pool.visibility}`),
          pool.owner ? t("owner", { name: pool.owner.name }) : null,
          pool.description,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {erreur && (
        <p className="t-gar t-err" role="alert">
          <span>{erreur === "forbidden" ? t("forbidden") : t("error")}</span>
        </p>
      )}

      {pool.entries.length === 0 ? (
        <div className="t-verre t-rc-vide">
          <span className="t-rc-rond" aria-hidden>
            <TalentIcon name="candidats" />
          </span>
          <b>{t("emptyPool.title")}</b>
          <span>{t("emptyPool.text")}</span>
          {permissions.manage && (
            <Link href="/app/hire/candidats?vue=talents" className="t-bt t-sec t-s t-press">
              {t("emptyPool.cta")}
            </Link>
          )}
        </div>
      ) : (
        <ul className="t-verre t-ri-pp">
          {pool.entries.map((entry) => {
            const name =
              entry.name ?? t("anonymous", { headline: entry.headline || t("noHeadline") });
            return (
              <li key={entry.profileId}>
                <span className={cx("t-rc-av", avatarTone(entry.profileId))} aria-hidden>
                  {entry.name ? initialsOf(entry.name) : "?"}
                </span>
                <Link
                  href={`/app/hire/talents/${entry.profileId}${offer ? `?offre=${offer}` : ""}`}
                  className="t-t t-press"
                >
                  <b>
                    <span className="t-rc-nom">{name}</span>
                    <span className="t-ri-etq">
                      {entry.origin.kind === "applied"
                        ? t("origin.applied")
                        : entry.origin.kind === "contact"
                          ? t("origin.contact")
                          : t("origin.search")}
                    </span>
                  </b>
                  <span>
                    {[
                      entry.name ? entry.headline : null,
                      entry.city,
                      t("added", { date: formatDayMonth(entry.createdAt) }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {entry.note && <span className="t-m">{entry.note}</span>}
                </Link>
                {permissions.manage && (
                  <form action={removeFromPoolAction}>
                    <input type="hidden" name="pool" value={pool.id} />
                    <input type="hidden" name="profile" value={entry.profileId} />
                    <button
                      type="submit"
                      className="t-bi t-press"
                      aria-label={t("remove", { name })}
                    >
                      <TalentIcon name="fermer" size="xs" />
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{t("notTold")}</span>
      </p>

      {permissions.manage && (
        <Sheet id="ri-v-menu" title={t("menuTitle")} closeLabel={t("sheet.close")}>
          <form action={renamePoolAction} className="t-ri-vnew">
            <input type="hidden" name="pool" value={pool.id} />
            <label htmlFor="ri-v-renommer">{t("rename")}</label>
            <div className="t-verre t-saisie">
              <input
                id="ri-v-renommer"
                name="name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={pool.name}
              />
            </div>
            <button type="submit" className="t-bt t-sec t-m t-press">
              {t("renameSubmit")}
            </button>
          </form>
          {canDelete && (
            <form action={deletePoolAction} className="t-ri-vnew">
              <input type="hidden" name="pool" value={pool.id} />
              <p className="t-rc-note">{t("deleteText")}</p>
              <button type="submit" className="t-bt t-sec t-d t-m t-press">
                {t("delete")}
              </button>
            </form>
          )}
        </Sheet>
      )}
    </div>
  );
}
