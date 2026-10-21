import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { avatarTone, initialsOf } from "@/components/recruiter/candidates";
import { OrbiLine } from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { createPoolAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { cheapestPlanWhere, listPublicPlans } from "@/server/services/plans";
import { poolsEnabled, poolsOverview } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hirePools");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const DAY = 86_400_000;

/**
 * Mes viviers (brief recruteur § 4 item 4, planche r2plus VIVIERS): the lists of talents kept for
 * later, with how many are available, and Orbi's line when one of them fits the newest offer.
 * The talents in a pool are never told; a pool only shows talents still visible or who applied.
 */
export default async function PoolsPage({ searchParams }: PageProps<"/app/hire/viviers">) {
  const query = await searchParams;
  // Old addresses opened a pool inside this page.
  if (one(query.vivier)) redirect(`/app/hire/viviers/${encodeURIComponent(one(query.vivier))}`);
  const { ctx } = await requireHire("/app/hire/viviers", "readApplications");
  const t = await getTranslations("hirePools");
  const format = await getFormatter();
  const now = new Date();
  const manage = hirePermissions(ctx.role).manage;
  const enabled = await poolsEnabled(db, ctx.organizationId);
  const tw = await getTranslations("hireWeb.pools");
  const head = (
    <>
      <FlowHead
        back="/app/hire/candidats?vue=talents"
        backLabel={t("back")}
        title={t("title")}
        end={
          enabled && manage ? (
            <SheetButton target="ri-creer" label={t("create")} className="t-bi t-press">
              <TalentIcon name="plus" size="s" />
            </SheetButton>
          ) : undefined
        }
      />
      {/* Web: the title, what a pool is for and « Créer un vivier » (planche `.w-h`). */}
      <div className="t-rw-h t-rw-web">
        <div className="t-t">
          <Link href="/app/hire/candidats?vue=talents" className="t-rw-crumb">
            <TalentIcon name="suivant" size="xs" />
            {t("back")}
          </Link>
          <h1>{t("title")}</h1>
          <p>{tw("sub")}</p>
        </div>
        {enabled && manage && (
          <SheetButton target="ri-creer" className="t-bt t-p t-m t-press">
            <TalentIcon name="plus" size="s" />
            {t("create")}
          </SheetButton>
        )}
      </div>
    </>
  );
  if (!enabled) {
    const plan = cheapestPlanWhere(
      await listPublicPlans(db),
      ["rh", "company"],
      (item) => item.entitlements["hire.shortlist"] === "true",
    );
    return (
      <div className="t-flux t-rw-viv">
        {head}
        <div className="t-rc-orbi">
          <div className="t-rc-lock">
            <b>
              <OrbiMark size={22} />
              {t("sheet.lockedTitle")}
            </b>
            <span>{plan ? t("sheet.locked", { plan: plan.name }) : t("sheet.lockedNoPlan")}</span>
            <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
              {t("sheet.seePlans")}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const [{ pools, suggestion }, shared] = await Promise.all([
    poolsOverview(db, ctx),
    can(db, { type: "organization", id: ctx.organizationId }, "org.talent_pools.shared"),
  ]);
  const updated = (date: Date) =>
    now.getTime() - date.getTime() < 7 * DAY
      ? format.relativeTime(date, now)
      : format.dateTime(date, { day: "numeric", month: "long" });
  const ok = one(query.ok);
  const toast = ok === "supprime" ? t("ok.deleted") : null;

  return (
    <div className="t-flux t-ri-viviers t-rw-viv">
      {toast && <ToastOnLoad message={toast} tone="success" />}
      {head}
      {one(query.erreur) && (
        <p className="t-gar t-err" role="alert">
          <span>{t("error")}</span>
        </p>
      )}

      {suggestion && (
        <OrbiLine
          action={
            <Link
              href={`/app/hire/viviers/${suggestion.poolId}?offre=${suggestion.offerId}`}
              className="t-bt t-sec t-s t-press"
            >
              {t("orbiSee")}
            </Link>
          }
        >
          {t.rich("orbi", {
            b: (chunks) => <b>{chunks}</b>,
            count: suggestion.count,
            pool: suggestion.poolName,
            offer: suggestion.offerTitle,
          })}
        </OrbiLine>
      )}

      {pools.length === 0 ? (
        <div className="t-verre t-rc-vide">
          <span className="t-rc-rond" aria-hidden>
            <TalentIcon name="favori" />
          </span>
          <b>{t("empty.title")}</b>
          <span>{t("empty.text")}</span>
        </div>
      ) : (
        <ul className="t-ri-vcartes">
          {pools.map((pool, index) => (
            <li key={pool.id}>
              <Link href={`/app/hire/viviers/${pool.id}`} className="t-verre t-ri-vc t-press">
                <span
                  className={cx("t-cases", ["t-g-oppo", "t-g-accomp", "t-g-former"][index % 3])}
                  aria-hidden
                >
                  <TalentIcon name="favori" size="s" />
                </span>
                <span className="t-t">
                  <b>{pool.name}</b>
                  <span>{t("line", { count: pool.count, updated: updated(pool.updatedAt) })}</span>
                  {pool.count > 0 && (
                    <span className="t-ri-vp">
                      <span className="t-ri-pile" aria-hidden>
                        {pool.people.map((person) => (
                          <i
                            key={person.profileId}
                            className={cx("t-rc-av", avatarTone(person.profileId))}
                          >
                            {person.name ? initialsOf(person.name) : "?"}
                          </i>
                        ))}
                      </span>
                      <small>
                        {[
                          pool.count > pool.people.length
                            ? t("more", { count: pool.count - pool.people.length })
                            : null,
                          t("available", { count: pool.available }),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                  )}
                </span>
                <TalentIcon name="suivant" size="s" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {manage && (
        <SheetButton target="ri-creer" className="t-bt t-sec t-m t-press t-ri-creer t-rw-tel">
          <TalentIcon name="plus" size="s" />
          {t("create")}
        </SheetButton>
      )}

      {manage && (
        <Sheet
          id="ri-creer"
          title={t("createTitle")}
          closeLabel={t("sheet.close")}
          defaultOpen={one(query.vivier) === "invalide"}
        >
          <form action={createPoolAction} className="t-ri-vnew">
            <input type="hidden" name="back" value="/app/hire/viviers" />
            <div className="t-champ">
              <label htmlFor="ri-v-nom">{t("name")}</label>
              <div className="t-verre t-saisie">
                <input
                  id="ri-v-nom"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder={t("sheet.placeholder")}
                />
              </div>
            </div>
            <div className="t-champ">
              <label htmlFor="ri-v-desc">{t("description")}</label>
              <div className="t-verre t-saisie">
                <textarea id="ri-v-desc" name="description" rows={2} maxLength={300} />
              </div>
            </div>
            <fieldset className="t-champ">
              <legend>{t("visibility")}</legend>
              <div className="t-puces">
                {(["private", "team", "org"] as const).map((value) => (
                  <label
                    key={value}
                    className={cx("t-puce t-rc-ch", value !== "private" && !shared && "t-ri-off")}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      defaultChecked={value === "private"}
                      disabled={value !== "private" && !shared}
                    />
                    {t(`visibilityOption.${value}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            {one(query.vivier) === "invalide" && (
              <p className="t-gar t-err" role="alert">
                <span>{t("invalid")}</span>
              </p>
            )}
            <p className="t-rc-note">{t("notTold")}</p>
            <button type="submit" className="t-bt t-p t-m t-press">
              {t("createSubmit")}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
