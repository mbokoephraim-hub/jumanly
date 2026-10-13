import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { Champ, classesSaisie, type ProprietesChamp } from "./champ";

type Proprietes = ProprietesChamp & Omit<ComponentProps<"input">, "id" | "required">;

export function ChampTexte({ id, label, aide, erreur, requis, className, ...reste }: Proprietes) {
  return (
    <Champ id={id} label={label} aide={aide} erreur={erreur} requis={requis}>
      {(aria) => <input className={cx(classesSaisie, "h-11", className)} {...aria} {...reste} />}
    </Champ>
  );
}
