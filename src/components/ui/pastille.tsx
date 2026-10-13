import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type TonPastille = "neutre" | "sapin" | "lime" | "succes" | "alerte" | "erreur" | "ia";

const tons: Record<TonPastille, string> = {
  neutre: "bg-brume text-sapin",
  sapin: "bg-sapin text-blanc",
  lime: "bg-lime text-sapin",
  succes: "bg-feuille/12 text-[#2b7a3a]",
  alerte: "bg-ambre/18 text-[#8a5a00]",
  erreur: "bg-corail/12 text-[#b23a2b]",
  ia: "bg-menthe-claire text-sapin",
};

/** Petite étiquette arrondie : statut, catégorie, mention IA. */
export function Pastille({
  ton = "neutre",
  icone,
  children,
  className,
}: {
  ton?: TonPastille;
  icone?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-pastille px-3 text-label font-medium",
        tons[ton],
        className,
      )}
    >
      {icone}
      {children}
    </span>
  );
}
