import { useTranslations } from "next-intl";
import { ProgressBar } from "./progress";

/**
 * Consumption of a limited entitlement (e.g. monthly AI credits).
 * A `limit` of `null` means unlimited.
 */
export function QuotaGauge({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const t = useTranslations("billing.quotas");
  const unlimited = limit === null;
  const ratio = unlimited || limit === 0 ? 0 : (used / limit) * 100;
  const tone = ratio >= 100 ? "error" : ratio >= 80 ? "warning" : "sapin";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium text-sapin">{label}</span>
        <span className="text-ardoise text-label">
          {unlimited ? t("unlimited") : t("usage", { used, limit })}
        </span>
      </div>
      {!unlimited && <ProgressBar value={ratio} label={label} tone={tone} />}
      {!unlimited && ratio >= 100 && (
        <p className="font-medium text-corail-fonce text-caption">{t("reached")}</p>
      )}
    </div>
  );
}
