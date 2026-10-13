import type { ReactNode } from "react";
import { Character } from "@/components/brand/character";

/** Illustrated empty state (§ 11.5): a brand character by default, and an action to move forward. */
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
    <div className="flex flex-col items-center gap-3 rounded-card bg-blanc px-6 py-10 text-center">
      {illustration ?? <Character name="amani" pose="perplexe" height={140} />}
      <p className="text-lg font-semibold text-sapin">{title}</p>
      {description && <p className="max-w-sm text-[15px] leading-6 text-ardoise">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
