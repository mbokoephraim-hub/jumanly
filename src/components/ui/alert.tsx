import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

export type AlertTone = "info" | "success" | "warning" | "error";

// Mockup 00-02 « Retours » : radius 16, icon in a 26 px disc.
const tones: Record<AlertTone, { box: string; disc: string; icon: IconName }> = {
  info: {
    box: "bg-blanc ring-[1.5px] ring-brume ring-inset",
    disc: "bg-creme text-sapin",
    icon: "info",
  },
  success: { box: "bg-lime-clair", disc: "bg-lime text-sapin", icon: "check" },
  warning: { box: "bg-ambre-fond", disc: "bg-ambre text-sapin", icon: "notification" },
  error: {
    box: "bg-blanc ring-[1.5px] ring-corail ring-inset",
    disc: "bg-down-fond text-down-texte",
    icon: "fermer",
  },
};

/** Contextual message. Errors are announced right away to screen readers. */
export function Alert({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const { box, disc, icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-[16px] px-[18px] py-3.5 text-sapin", box)}
    >
      <span
        aria-hidden
        className={cx("flex size-[26px] shrink-0 items-center justify-center rounded-full", disc)}
      >
        <Icon name={icon} className="size-3.5" />
      </span>
      <div className="flex flex-1 flex-col gap-1 pt-0.5">
        <p className="text-sm leading-5 font-semibold">{title}</p>
        {children && <div className="text-sm leading-5">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
