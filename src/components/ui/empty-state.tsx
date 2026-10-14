import type { ReactNode } from "react";
import { Character } from "@/components/brand/character";

/** Illustrated empty state (mockup 00-02): a brand character, a title, a line and one action. */
export function EmptyState({
  illustration,
  title,
  description,
  action,
}: {
  /** Replaces the default character, e.g. `<Character name="nadia" pose="montre" />`. */
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-box bg-blanc px-7 py-9 text-center">
      {illustration ?? <Character name="kofi" pose="repos" height={140} />}
      <p className="text-h3 text-sapin">{title}</p>
      {description && <p className="max-w-[420px] text-sm leading-5 text-ardoise">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
