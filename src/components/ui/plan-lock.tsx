import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { ButtonLink } from "./button";

/**
 * Plan lock (§ 11.5): shown when an entitlement is missing. The plan name comes from the
 * database (never tested in code, CLAUDE.md § 2). Applying is never locked (CLAUDE.md § 1).
 */
export function PlanLock({
  plan,
  description,
  compact = false,
}: {
  plan: string;
  description?: string;
  compact?: boolean;
}) {
  const t = useTranslations("common");
  if (compact) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-sapin px-3 text-blanc text-label">
        <Lock aria-hidden className="size-3.5 text-lime" />
        {t("requiredPlan", { plan })}
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border-2 border-dashed border-sapin/25 p-5">
      <span className="flex size-10 items-center justify-center rounded-full bg-sapin text-lime">
        <Lock aria-hidden className="size-5" />
      </span>
      <p className="font-semibold">{t("requiredPlan", { plan })}</p>
      {description && <p className="text-[15px] leading-6 text-ardoise">{description}</p>}
      <ButtonLink href="/tarifs" size="sm">
        {t("seePlans")}
      </ButtonLink>
    </div>
  );
}
