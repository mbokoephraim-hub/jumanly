import type { ReactNode } from "react";

/** Shown when a list is empty, with an action to move forward. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-sapin/20 px-6 py-10 text-center">
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-full bg-menthe-claire text-sapin">
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold text-sapin">{title}</p>
      {description && <p className="max-w-sm text-[15px] leading-6 text-ardoise">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
