import { Icon } from "@/components/brand/icon";
import { useTranslations } from "next-intl";
import { ButtonLink } from "./button";

/**
 * Plan lock (mockup 00-02): shown when an entitlement is missing. The plan name comes from the
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
      <span className="inline-flex h-6 items-center gap-1.5 rounded-pill bg-sapin px-2.5 text-[11px] font-semibold text-neon">
        <Icon name="lock" className="size-3.5" />
        {t("requiredPlan", { plan })}
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[20px] bg-blanc px-5 py-4 ring-[1.5px] ring-brume ring-inset">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-creme text-sapin">
        <Icon name="lock" className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 basis-48 flex-col">
        <p className="text-[13.5px] leading-5 font-semibold">{t("requiredPlan", { plan })}</p>
        {description && <p className="text-xs leading-[17px] text-ardoise">{description}</p>}
      </div>
      <ButtonLink href="/tarifs" size="sm" variant="secondary">
        {t("seePlans")}
      </ButtonLink>
    </div>
  );
}
