import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/cx";

export type AlertTone = "info" | "success" | "warning" | "error";

const tones = {
  info: { classes: "border-sapin/15 bg-blanc", Icon: Info, color: "text-sapin" },
  success: { classes: "border-feuille/30 bg-feuille/8", Icon: CircleCheck, color: "text-feuille" },
  warning: { classes: "border-ambre/40 bg-ambre/10", Icon: TriangleAlert, color: "text-[#b07a00]" },
  error: { classes: "border-corail/35 bg-corail/8", Icon: CircleAlert, color: "text-corail" },
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
  const { classes, Icon, color } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-md border p-4", classes)}
    >
      <Icon aria-hidden className={cx("mt-0.5 size-5 shrink-0", color)} strokeWidth={2} />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-semibold text-sapin">{title}</p>
        {children && <div className="text-[15px] leading-6 text-sapin">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
