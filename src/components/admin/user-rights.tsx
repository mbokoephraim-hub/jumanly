import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { adminCard, adminTitle, Tag, type TagTone } from "@/components/admin/kit";
import { formatShortDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { parseLimit } from "@/server/entitlements";
import type { RightRow, RightSource } from "@/server/services/admin-users";

type Translate = Awaited<ReturnType<typeof getTranslations<"admin">>>;

/** « Crédits d'assistance IA par mois » for `ai.credits.monthly`; the key itself when unnamed. */
export function rightLabel(t: Translate, key: string) {
  const id = `entitlement.${key.replaceAll(".", "_")}`;
  return t.has(id as never) ? t(id as never) : key;
}

/** « Inclus », « Avancé », « Illimité », « 150 »… */
export function rightValue(t: Translate, type: string, value: string) {
  if (type === "boolean") return t(value === "true" ? "users.rights.yes" : "users.rights.no");
  if (type === "limit") {
    if (value === "contract") return t("users.rights.contract");
    const number = parseLimit(value);
    return number < 0 ? t("users.rights.unlimited") : String(number);
  }
  const id = `entitlementLevel.${value}`;
  return t.has(id as never) ? t(id as never) : value;
}

export const sourceTone: Record<RightSource, TagTone> = {
  plan: "lime",
  license: "menthe",
  gift: "neon",
  free: "neutral",
  override: "warning",
};

/**
 * « Droits et quotas » of a user card (Admin v2, étape 3): every entitlement of the plan with its
 * value, the quota used this period and where it comes from (plan, licence, gift, extra).
 */
export async function UserRights({
  plan,
  source,
  rows,
  granted,
  removeHref,
  revokeHref,
}: {
  plan: { planName: string; periodEnd: Date };
  source: RightSource;
  rows: RightRow[];
  granted: { id: string; currentPeriodEnd: Date; plan: { name: string } }[];
  /** Link to the « Retirer l'ajout » panel, when the viewer can act. */
  removeHref?: (overrideId: string) => string;
  revokeHref?: (subscriptionId: string) => string;
}) {
  const t = await getTranslations("admin");
  const visible = rows.filter((row) => row.key !== "jobs.apply");
  return (
    <section
      id="utilisateurs-droits"
      aria-labelledby="utilisateurs-droits-title"
      className={cx(adminCard, "flex scroll-mt-6 flex-col gap-3.5")}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 id="utilisateurs-droits-title" className={cx(adminTitle, "flex-1 !text-[17px]")}>
          {t("users.rights.title")}
        </h2>
        <span className="text-[13px] font-semibold">
          {t("users.rights.planLine", { plan: plan.planName })}
        </span>
        <Tag tone={sourceTone[source]}>{t(`users.rights.source.${source}`)}</Tag>
      </div>
      <p className="text-[12.5px] leading-[18px] text-ardoise">{t("users.rights.intro")}</p>

      {granted.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-creme px-3.5 py-2.5">
          <p className="text-[12px] font-semibold">{t("users.rights.granted")}</p>
          <ul className="flex flex-col gap-1">
            {granted.map((grant) => (
              <li key={grant.id} className="flex items-center gap-3 text-[12.5px]">
                <span className="flex-1">
                  {t("users.rights.grantedLine", {
                    plan: grant.plan.name,
                    date: formatShortDate(grant.currentPeriodEnd),
                  })}
                </span>
                {revokeHref && (
                  <Link
                    href={revokeHref(grant.id)}
                    scroll={false}
                    className="font-semibold text-corail-fonce underline underline-offset-2"
                  >
                    {t("users.action.grantPlan.revoke")}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="flex flex-col">
        {visible.map((row) => {
          const limit = row.type === "limit" ? parseLimit(row.value) : null;
          const value = rightValue(t, row.type, row.value);
          return (
            <div
              key={row.key}
              className="flex flex-col gap-1 border-brume py-2.5 not-first:border-t sm:flex-row sm:items-center sm:gap-3"
            >
              <dt className="flex min-w-0 flex-1 flex-col text-[13px] leading-[18px]">
                <span className="font-medium">{rightLabel(t, row.key)}</span>
                {row.override && (
                  <span className="text-[11.5px] leading-4 text-ardoise">
                    {row.override.expiresAt
                      ? t("users.rights.overrideUntil", {
                          date: formatShortDate(row.override.expiresAt),
                        })
                      : t("users.rights.overrideNoEnd")}
                    {" · "}
                    {row.override.reason}
                  </span>
                )}
              </dt>
              <dd className="flex items-center gap-2.5 text-[12.5px] sm:justify-end">
                <span
                  className={cx(
                    "font-semibold",
                    row.type === "boolean" && row.value !== "true" && "font-normal text-ardoise",
                  )}
                >
                  {row.used !== null && limit !== null && limit >= 0
                    ? t("users.rights.usedOf", { used: row.used, limit: value })
                    : row.used !== null && row.used > 0
                      ? `${value} · ${t("users.rights.usedOnly", { used: row.used })}`
                      : value}
                </span>
                {row.override && (
                  <>
                    <Tag tone="warning">{t("users.rights.source.override")}</Tag>
                    {removeHref && (
                      <Link
                        href={removeHref(row.override.id)}
                        scroll={false}
                        aria-label={`${t("users.action.override.removeTitle")} · ${rightLabel(t, row.key)}`}
                        className="grid size-7 place-items-center rounded-full bg-creme hover:bg-brume"
                      >
                        <Icon name="fermer" className="size-3.5" />
                      </Link>
                    )}
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
