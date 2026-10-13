import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/cx";

export type TonAlerte = "info" | "succes" | "alerte" | "erreur";

const tons = {
  info: { classes: "border-sapin/15 bg-blanc", Icone: Info, couleur: "text-sapin" },
  succes: {
    classes: "border-feuille/30 bg-feuille/8",
    Icone: CircleCheck,
    couleur: "text-feuille",
  },
  alerte: {
    classes: "border-ambre/40 bg-ambre/10",
    Icone: TriangleAlert,
    couleur: "text-[#b07a00]",
  },
  erreur: { classes: "border-corail/35 bg-corail/8", Icone: CircleAlert, couleur: "text-corail" },
};

/** Message contextuel. Les erreurs sont annoncées immédiatement aux lecteurs d'écran. */
export function Alerte({
  ton = "info",
  titre,
  children,
  action,
}: {
  ton?: TonAlerte;
  titre: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const { classes, Icone, couleur } = tons[ton];
  return (
    <div
      role={ton === "erreur" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-composant border p-4", classes)}
    >
      <Icone aria-hidden className={cx("mt-0.5 size-5 shrink-0", couleur)} strokeWidth={2} />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-semibold text-sapin">{titre}</p>
        {children && <div className="text-[15px] leading-6 text-ardoise">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
