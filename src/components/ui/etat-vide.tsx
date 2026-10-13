import type { ReactNode } from "react";

/** Message affiché quand une liste est vide, avec une action pour avancer. */
export function EtatVide({
  icone,
  titre,
  description,
  action,
}: {
  icone?: ReactNode;
  titre: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-carte border border-dashed border-sapin/20 px-6 py-10 text-center">
      {icone && (
        <div className="flex size-14 items-center justify-center rounded-full bg-menthe-claire text-sapin">
          {icone}
        </div>
      )}
      <p className="text-lg font-semibold text-sapin">{titre}</p>
      {description && <p className="max-w-sm text-[15px] leading-6 text-ardoise">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
