import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { planValues } from "@/components/site/pricing";
import { Badge } from "@/components/ui";
import { dynamic, numbered } from "@/i18n/dynamic";
import { formatUsd } from "@/lib/money";
import type { PublicPlan } from "@/server/services/plans";

/**
 * Step 2 of sign-up: one radio card per plan of the family. Names, prices and features come
 * from the database and the plan's `contentKey` (never from the code).
 */
export async function PlanChoice({ plans, selected }: { plans: PublicPlan[]; selected?: string }) {
  const t = dynamic(await getTranslations());
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{t("signup.stepper.plan")}</legend>
      {plans.map((plan) => {
        const values = planValues(plan);
        const features = numbered(t, `${plan.contentKey}.f`, values).slice(0, 5);
        const price =
          plan.priceCents === 0
            ? t("signup.plan.price.free")
            : t("signup.plan.price.monthly", { price: formatUsd(plan.priceCents ?? 0) });
        return (
          <label
            key={plan.code}
            className="flex cursor-pointer gap-4 rounded-card border-2 border-transparent bg-blanc p-5 has-checked:border-sapin has-focus-visible:ring-3 has-focus-visible:ring-feuille/40"
          >
            <input
              type="radio"
              name="forfait"
              value={plan.code}
              defaultChecked={plan.code === selected}
              className="mt-1 size-5 shrink-0 accent-sapin"
            />
            <span className="flex flex-1 flex-col gap-2">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-h3">{plan.name}</span>
                <span className="font-semibold">{price}</span>
              </span>
              {plan.recommended && (
                <Badge tone="lime" className="self-start">
                  {t("signup.plan.recommended")}
                </Badge>
              )}
              <span className="text-sm text-ardoise">{t(`${plan.contentKey}.ideal`)}</span>
              <ul className="flex flex-col gap-1 text-sm">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Icon name="valider" className="mt-0.5 size-4 shrink-0 text-feuille" />
                    {feature}
                  </li>
                ))}
              </ul>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
