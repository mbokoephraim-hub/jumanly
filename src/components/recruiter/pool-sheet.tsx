import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet } from "@/components/talent/sheet";
import { addToPoolAction, createPoolAction } from "@/server/actions/hire-advanced";

/**
 * « Ajouter à un vivier » from a talent's profile or a candidate's file (brief recruteur § 4 item
 * 4): one tap on a pool, or a new pool named on the spot. The talent is never told.
 */
export async function PoolSheet({
  id,
  profileId,
  back,
  pools,
  lockedPlan,
}: {
  id: string;
  profileId: string;
  /** The page the action comes back to (with `ok=vivier`). */
  back: string;
  /** The pools the member may fill, with whether the talent is already in it. */
  pools: { id: string; name: string; count: number; has: boolean }[] | null;
  /** When pools are not in the plan: the plan that has them. */
  lockedPlan: string | null;
}) {
  const t = await getTranslations("hirePools.sheet");
  return (
    <Sheet id={id} title={t("title")} closeLabel={t("close")}>
      {pools === null ? (
        <div className="t-rc-lock">
          <b>{t("lockedTitle")}</b>
          <span>{lockedPlan ? t("locked", { plan: lockedPlan }) : t("lockedNoPlan")}</span>
          <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
            {t("seePlans")}
          </Link>
        </div>
      ) : (
        <>
          {pools.length > 0 && (
            <ul className="t-ri-vlist">
              {pools.map((pool) => (
                <li key={pool.id}>
                  <form action={addToPoolAction}>
                    <input type="hidden" name="pool" value={pool.id} />
                    <input type="hidden" name="profile" value={profileId} />
                    <input type="hidden" name="back" value={back} />
                    <button
                      type="submit"
                      disabled={pool.has}
                      className="t-press"
                      aria-label={
                        pool.has
                          ? t("already", { name: pool.name })
                          : t("addTo", { name: pool.name })
                      }
                    >
                      <span className="t-cases t-g-oppo" aria-hidden>
                        <TalentIcon name="favori" size="s" />
                      </span>
                      <span className="t-t">
                        <b>{pool.name}</b>
                        <span>{t("count", { count: pool.count })}</span>
                      </span>
                      {pool.has ? (
                        <TalentIcon name="valider" size="s" />
                      ) : (
                        <TalentIcon name="plus" size="s" />
                      )}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={createPoolAction} className="t-ri-vnew">
            <input type="hidden" name="profile" value={profileId} />
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="visibility" value="private" />
            <label htmlFor={`${id}-nom`}>{pools.length ? t("newLabel") : t("firstLabel")}</label>
            <div className="t-verre t-saisie">
              <input
                id={`${id}-nom`}
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder={t("placeholder")}
              />
            </div>
            <button type="submit" className="t-bt t-sec t-m t-press">
              <TalentIcon name="plus" size="xs" />
              {t("create")}
            </button>
          </form>
          <p className="t-rc-note">{t("private")}</p>
        </>
      )}
    </Sheet>
  );
}
