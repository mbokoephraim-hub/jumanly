import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { planValues } from "@/components/site/pricing";
import { dynamic, numbered } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import type { PublicPlan } from "@/server/services/plans";

/**
 * Step 2 of sign-up (mockup 02-05): one card per plan of the family, chosen with a radio. The
 * chosen card turns Sapin and its button reads « Sélectionné », in CSS only (works without
 * JavaScript). Names, prices and features come from the database and the plan's `contentKey`.
 */
export async function PlanChoice({ plans, selected }: { plans: PublicPlan[]; selected?: string }) {
  const t = dynamic(await getTranslations());
  return (
    <fieldset>
      <legend className="sr-only">{t("signup.stepper.plan")}</legend>
      <ul className="grid gap-4 md:grid-cols-2 md:items-start">
        {plans.map((plan, index) => {
          const key = plan.contentKey;
          const values = planValues(plan);
          const free = plan.priceCents === 0;
          const previous = index > 0 && t.has(`${key}.includes`) ? plans[index - 1] : undefined;
          const tagline = plan.tagline || (t.has(`${key}.tagline`) ? t(`${key}.tagline`) : "");
          const badge = plan.recommended
            ? t("signup.plan.recommended")
            : t.has(`${key}.badge`)
              ? t(`${key}.badge`)
              : undefined;
          return (
            <li key={plan.code} className="flex">
              <label
                className={cx(
                  "group relative flex flex-1 cursor-pointer flex-col gap-3.5 rounded-[24px] bg-blanc p-5 ring-[1.5px] ring-brume transition-shadow ring-inset lg:p-[22px]",
                  "hover:ring-sapin/40 has-checked:bg-sapin has-checked:text-blanc has-checked:shadow-[0_0_0_4px_rgb(166_242_107/0.9)] has-checked:ring-0",
                  "has-focus-visible:shadow-[0_0_0_5px_rgb(166_242_107/0.9)]",
                )}
              >
                <input
                  type="radio"
                  name="forfait"
                  value={plan.code}
                  defaultChecked={plan.code === selected}
                  className="peer sr-only"
                />
                <span className="flex items-start justify-between gap-3">
                  <span className="text-xl font-bold">{plan.name}</span>
                  {badge && (
                    <span
                      className={cx(
                        "rounded-pill px-2.5 py-1 text-[11px] font-semibold text-sapin",
                        plan.recommended ? "bg-lime" : "bg-neon",
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </span>
                {tagline && (
                  <span className="-mt-2 text-[13px] text-ardoise group-has-checked:text-blanc/75">
                    {tagline}
                  </span>
                )}
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[34px] leading-none font-bold tracking-tight">
                    {free ? t("signup.plan.price.free") : formatUsd(plan.priceCents ?? 0)}
                  </span>
                  {!free && (
                    <span className="text-[13px] text-ardoise group-has-checked:text-blanc/75">
                      {t("pricing.card.currency")}
                      {t("pricing.card.perMonth")}
                    </span>
                  )}
                </span>
                <span className="text-xs leading-[17px] text-ardoise group-has-checked:text-blanc/75">
                  {t("pricing.card.idealFor", { audience: t(`${key}.ideal`) })}
                </span>
                <span
                  aria-hidden
                  className={cx(
                    "flex h-10 items-center justify-center gap-2 rounded-pill text-[13px] font-semibold",
                    "group-has-checked:bg-lime group-has-checked:text-sapin group-has-checked:ring-0",
                    free ? "bg-sapin text-blanc" : "ring-[1.5px] ring-brume ring-inset",
                  )}
                >
                  <span className="flex items-center gap-2 group-has-checked:hidden">
                    {free
                      ? t("signup.plan.selectFree")
                      : t("signup.plan.select", { plan: plan.name })}
                  </span>
                  <span className="hidden items-center gap-2 group-has-checked:flex">
                    <Icon name="check" className="size-4" />
                    {t("signup.plan.selected")}
                  </span>
                </span>
                <span aria-hidden className="h-px bg-brume group-has-checked:bg-blanc/15" />
                {previous && (
                  <span className="text-xs font-semibold">
                    {t("signup.plan.includesPrevious", { plan: previous.name })}
                  </span>
                )}
                <span className="flex flex-col gap-2">
                  {numbered(t, `${key}.f`, values).map((feature) => (
                    <span
                      key={feature}
                      className="flex items-start gap-2.5 text-[13px] leading-[18px]"
                    >
                      <Icon
                        name="check"
                        className="mt-px size-4 shrink-0 text-feuille-fonce group-has-checked:text-lime"
                      />
                      {feature}
                    </span>
                  ))}
                </span>
                {t.has(`${key}.note`) && (
                  <span className="text-[11px] leading-4 text-ardoise italic group-has-checked:text-blanc/70">
                    {t(`${key}.note`)}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
