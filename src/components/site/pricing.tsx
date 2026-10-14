import { getTranslations } from "next-intl/server";
import type { PlanFamily } from "@/generated/prisma/client";
import { Icon } from "@/components/brand/icon";
import { compareRows, type CompareCell } from "@/config/pricing-compare";
import { dynamic, numbered } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { PlanCard } from "@/components/ui";
import { limitOf, planCtaHref, plansOf, type PublicPlan } from "@/server/services/plans";

/** Values injected in a plan's texts: price, seats and active jobs, all read from the database. */
export function planValues(plan: PublicPlan) {
  return {
    price: plan.priceCents === null ? "" : formatUsd(plan.priceCents),
    seats: limitOf(plan, "org.seats") ?? limitOf(plan, "org.seats.min") ?? 0,
    jobs: limitOf(plan, "jobs.active.max") ?? 0,
  };
}

/** Plan cards of one family, with the texts of each plan's `contentKey`. */
export async function FamilyPlans({ plans, family }: { plans: PublicPlan[]; family: PlanFamily }) {
  const t = dynamic(await getTranslations());
  const list = plansOf(plans, family);
  return (
    <ul
      className={cx(
        "grid gap-4 md:grid-cols-2",
        list.length === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {list.map((plan, index) => {
        const key = plan.contentKey;
        const values = planValues(plan);
        const previous = index > 0 && t.has(`${key}.includes`) ? list[index - 1] : undefined;
        return (
          <li key={plan.code} className="flex [&>article]:flex-1">
            <PlanCard
              name={plan.name}
              priceCents={plan.priceCents}
              audience={t(`${key}.ideal`)}
              features={numbered(t, `${key}.f`, values)}
              includesPlan={previous?.name}
              recommended={plan.recommended}
              badge={t.has(`${key}.badge`) ? t(`${key}.badge`) : undefined}
              note={t.has(`${key}.note`) ? t(`${key}.note`) : undefined}
              ctaLabel={t(`${key}.cta`)}
              ctaHref={planCtaHref(plan)}
            />
          </li>
        );
      })}
    </ul>
  );
}

const comparePrefix: Partial<Record<PlanFamily, string>> = {
  talent: "pricing.talent.compare",
  rh: "pricing.rh.compare",
  company: "pricing.company.compare",
};

/**
 * Shared labels (toggle, first column) are those of the Talents comparison, the only ones in the texts.
 * Detailed comparison, folded by default (native <details>). Checks and dashes are icons with a
 * text alternative (`common.included` / `common.notIncluded`). The recommended plan is highlighted.
 */
export async function CompareTable({ plans, family }: { plans: PublicPlan[]; family: PlanFamily }) {
  const t = dynamic(await getTranslations());
  const rows = compareRows[family];
  const prefix = comparePrefix[family];
  if (!rows || !prefix) return null;
  const list = plansOf(plans, family);

  const cell = (value: CompareCell) => {
    switch (value.kind) {
      case "check":
        return (
          <Icon
            name="valider"
            label={t("common.included")}
            className="mx-auto size-5 text-feuille"
          />
        );
      case "dash":
        return (
          <span role="img" aria-label={t("common.notIncluded")} className="inline-flex">
            <span aria-hidden className="mx-auto h-0.5 w-3.5 rounded-pill bg-ardoise" />
          </span>
        );
      case "value":
        return value.value;
      case "text":
        return t(value.key.startsWith("ui.") ? value.key : `${prefix}.${value.key}`, value.values);
    }
  };

  return (
    <details className="group rounded-card bg-blanc p-5 md:p-6">
      <summary className="flex cursor-pointer list-none flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 [&::-webkit-details-marker]:hidden">
        <h3 className="text-h2">{t(`${prefix}.title`)}</h3>
        <span className="flex items-center gap-1 text-sm font-semibold text-feuille-fonce sm:whitespace-nowrap">
          <span className="group-open:hidden">{t("pricing.talent.compare.toggleShow")}</span>
          <span className="hidden group-open:inline">{t("pricing.talent.compare.toggleHide")}</span>
          <Icon name="chev-d" className="size-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div
        className="mt-5 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={t(`${prefix}.title`)}
      >
        <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
          <thead>
            <tr>
              <th scope="col" className="py-3 pr-4 font-semibold">
                {t("pricing.talent.compare.colFeature")}
              </th>
              {list.map((plan) => (
                <th
                  key={plan.code}
                  scope="col"
                  className={cx(
                    "px-3 py-3 text-center font-semibold",
                    plan.recommended && "rounded-t-md bg-lime",
                  )}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-brume">
                <th scope="row" className="py-3 pr-4 font-normal">
                  {t(`${prefix}.${row.label}`)}
                </th>
                {list.map((plan) => (
                  <td
                    key={plan.code}
                    className={cx("px-3 py-3 text-center", plan.recommended && "bg-lime/40")}
                  >
                    {cell(row.cell(plan))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
