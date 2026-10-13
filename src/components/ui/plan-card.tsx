import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { Badge } from "./badge";
import { ButtonLink } from "./button";

/**
 * Plan card (§ 11.5). Everything comes from the `Plan` table (name, price in USD cents,
 * features): nothing about a plan is written in the code (CLAUDE.md § 2).
 */
export function PlanCard({
  name,
  priceCents,
  audience,
  features,
  includesPlan,
  recommended = false,
  current = false,
  ctaLabel,
  ctaHref,
}: {
  name: string;
  /** `0` for a free plan, `null` for a quote. */
  priceCents: number | null;
  audience: string;
  features: string[];
  includesPlan?: string;
  recommended?: boolean;
  current?: boolean;
  ctaLabel: string;
  ctaHref: string;
}) {
  const t = useTranslations();
  return (
    <article
      className={cx(
        "flex flex-col gap-4 rounded-card border-2 bg-blanc p-6",
        recommended ? "border-sapin" : "border-transparent",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-h2">{name}</h3>
        {recommended && <Badge tone="lime">{t("common.recommended")}</Badge>}
      </div>
      <p className="flex items-baseline gap-1">
        {priceCents === null ? (
          <span className="text-h1">{t("pricing.card.quote")}</span>
        ) : priceCents === 0 ? (
          <span className="text-h1">{t("pricing.card.free")}</span>
        ) : (
          <>
            <span className="text-h1">{formatUsd(priceCents)}</span>
            <span className="text-ardoise">
              {t("pricing.card.currency")}
              {t("pricing.card.perMonth")}
            </span>
          </>
        )}
      </p>
      <p className="text-sm text-ardoise">{t("pricing.card.idealFor", { audience })}</p>
      {includesPlan && (
        <p className="text-sm font-semibold">
          {t("pricing.card.includesPrevious", { plan: includesPlan })}
        </p>
      )}
      <ul className="flex flex-col gap-2 text-[15px] leading-6">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check aria-hidden className="mt-1 size-4 shrink-0 text-feuille" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2">
        {current ? (
          <Badge tone="neutral">{t("pricing.card.current")}</Badge>
        ) : (
          <ButtonLink href={ctaHref} variant={recommended ? "primary" : "secondary"} fullWidth>
            {ctaLabel}
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
