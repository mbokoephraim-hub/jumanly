import { cx } from "@/lib/cx";

/** Bloc gris animé affiché pendant un chargement. */
export function Squelette({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-petit bg-brume/70", className)} />;
}
