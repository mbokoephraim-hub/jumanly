import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { Card, type CardTone } from "./card";

/** Pale disc behind the icon of a stat card, after the module it belongs to (mockup 00-03). */
const iconTones = {
  learn: "bg-lime-clair",
  jobs: "bg-[#ddf3eb]",
  neutral: "bg-gris-clair",
} as const;

/** Key figure (mockup 00-03): label, icon in a pale disc, big value, optional trend or hint. */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
  iconTone = "neutral",
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: CardTone;
  icon?: IconName;
  iconTone?: keyof typeof iconTones;
}) {
  return (
    <Card tone={tone} className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] leading-[18px] font-medium opacity-75">{label}</p>
        {icon && (
          <span
            aria-hidden
            className={cx(
              "flex size-[42px] shrink-0 items-center justify-center rounded-full text-sapin",
              iconTones[iconTone],
            )}
          >
            <Icon name={icon} className="size-5" />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-big">{value}</p>
      {hint && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">{hint}</div>}
    </Card>
  );
}
