import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

const barTones = {
  feuille: "bg-feuille",
  sapin: "bg-sapin",
  lime: "bg-lime",
  ai: "bg-ia",
  warning: "bg-ambre",
  error: "bg-corail",
};

/** Horizontal progress bar (0 to 100), 8 px on a Brume track (mockup 00-02). */
export function ProgressBar({
  value,
  label,
  tone = "feuille",
  onTint = false,
}: {
  value: number;
  label: string;
  tone?: keyof typeof barTones;
  /** On a module tint (Lime, Néon…): translucent Sapin track. */
  onTint?: boolean;
}) {
  const percent = clamp(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cx("h-2 w-full overflow-hidden rounded-pill", onTint ? "bg-sapin/14" : "bg-brume")}
    >
      <div
        className={cx("h-full rounded-pill transition-[width]", barTones[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Circular progress arc (brand guidelines § 10), with the percentage in the middle. */
export function ProgressRing({
  value,
  label,
  size = 72,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  const t = useTranslations("ui");
  const percent = clamp(value);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="11" className="stroke-brume" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          className="stroke-lime"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <span
        className="absolute font-semibold text-sapin"
        style={{ fontSize: Math.round(size * 0.2) }}
        aria-hidden
      >
        {t("percent", { value: percent })}
      </span>
    </div>
  );
}
