import { cx } from "@/lib/cx";

/** Animated grey block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-sm bg-brume/70", className)} />;
}
