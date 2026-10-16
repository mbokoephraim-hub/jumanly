import { cx } from "@/lib/cx";

/**
 * Segmented control (Admin v4, étape 7): a Brume pill holding the options, the chosen one in
 * white. Shared by the tabs of a page (Jobs, Learn, Mes candidatures, Hire, admin lists).
 */
export const segmentedList = "flex w-max max-w-full gap-1 rounded-pill bg-brume/70 p-1";

export function segmentedItem(active: boolean, className?: string) {
  return cx(
    "flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-4 text-[13px] whitespace-nowrap transition-colors",
    active
      ? "bg-blanc font-semibold text-sapin shadow-[0_1px_3px_rgb(11_26_31/0.12)]"
      : "font-medium text-sapin/80 hover:bg-blanc/60 hover:text-sapin",
    className,
  );
}
